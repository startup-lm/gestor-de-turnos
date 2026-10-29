import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { requireAdmin } from "@/lib/api/auth";
import { fetchGooglePlaceReviews } from "@/lib/services/googlePlaces";
import { GoogleReviewsConfig } from "@/lib/types/BusinessSettings";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const input = (body.input || body.placeId || "").trim();

    if (!input) {
      return NextResponse.json(
        { error: "Ingresá el link de Google Maps, el nombre del local o el Place ID para sincronizar." },
        { status: 400 }
      );
    }

    // 1. Obtener la configuración actual de business_settings para preservar preferencias
    const { data: currentSettings, error: fetchErr } = await supabaseAdmin
      .from("business_settings")
      .select("google_reviews")
      .eq("id", 1)
      .single();

    if (fetchErr) {
      console.error("Error al obtener business_settings para sync:", fetchErr);
    }

    const currentConfig: GoogleReviewsConfig = currentSettings?.google_reviews || {};

    // 2. Consultar Google Places API (resolviendo automáticamente link, texto o place ID)
    const result = await fetchGooglePlaceReviews({
      input,
      apiKey: process.env.GOOGLE_PLACES_API_KEY,
    });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || "No se pudieron obtener las reseñas de Google." },
        { status: 400 }
      );
    }

    // 3. Fusionar datos nuevos manteniendo configuración de visibilidad del usuario
    const mergedConfig: GoogleReviewsConfig = {
      ...currentConfig,
      ...result.data,
      enabled: currentConfig.enabled ?? true,
      show_in_hero: currentConfig.show_in_hero ?? true,
      show_in_home: currentConfig.show_in_home ?? true,
      show_in_about: currentConfig.show_in_about ?? true,
      place_id: result.data.place_id || currentConfig.place_id,
    };

    // 4. Guardar en Supabase
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from("business_settings")
      .update({ google_reviews: mergedConfig })
      .eq("id", 1)
      .select("google_reviews")
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    revalidateTag("business-settings");
    return NextResponse.json({
      success: true,
      google_reviews: updated?.google_reviews ?? mergedConfig,
    });
  } catch (err: unknown) {
    console.error("Error en sync de google reviews:", err);
    const message = err instanceof Error ? err.message : "Error interno del servidor al sincronizar.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
