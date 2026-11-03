import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { requireAdmin } from "@/lib/api/auth";
import { fetchGooglePlaceReviews } from "@/lib/services/googlePlaces";
import type { GoogleReviewsConfig } from "@/lib/types/BusinessSettings";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    let targetPlaceId = (body.input || body.placeId || body.place_id || "").trim();

    if (!targetPlaceId) {
      const { data: currentSettings, error: fetchErr } = await supabaseAdmin
        .from("business_settings")
        .select("google_reviews")
        .eq("id", 1)
        .single();

      if (fetchErr) {
        console.error("Error al obtener business_settings para sync:", fetchErr);
      }

      const currentConfig: GoogleReviewsConfig = currentSettings?.google_reviews || {};
      targetPlaceId = (currentConfig.place_id || "").trim();
    }

    if (!targetPlaceId) {
      return NextResponse.json(
        { error: "Ingresá el link de Google Maps, el nombre del local o el Place ID para sincronizar." },
        { status: 400 }
      );
    }

    // Consulta en vivo sin guardar en base de datos
    const result = await fetchGooglePlaceReviews({
      input: targetPlaceId,
      apiKey: process.env.GOOGLE_PLACES_API_KEY,
      revalidateSeconds: 0,
    });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || "No se pudieron obtener las reseñas de Google." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      rating: typeof result.data.rating === "number" ? result.data.rating : null,
      total: typeof result.data.user_ratings_total === "number" ? result.data.user_ratings_total : 0,
      reviews: result.data.reviews || [],
      googleMapsUri: result.data.googleMapsUri,
      writeReviewUrl: result.data.write_review_url,
      place_id: result.data.place_id,
    });
  } catch (err: unknown) {
    console.error("Error en POST /api/google-reviews/sync:", err);
    const msg = err instanceof Error ? err.message : "Error interno del servidor";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
