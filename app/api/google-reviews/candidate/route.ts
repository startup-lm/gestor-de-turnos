import { NextResponse } from "next/server";
import { parseBody } from "@/lib/api/parseBody";
import { GoogleReviewsCandidateSchema } from "@/lib/schemas";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { requireAdmin } from "@/lib/api/auth";
import { getGooglePlaceCandidate } from "@/lib/services/googlePlaces";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    let query = (searchParams.get("query") || "").trim();

    // Si no enviaron query explícita, consultar los datos configurados en el local
    if (!query) {
      const { data: settings } = await supabaseAdmin
        .from("business_settings")
        .select("business_name, location_address")
        .eq("id", 1)
        .single();

      const name = settings?.business_name || "";
      const address = settings?.location_address || "";
      query = `${name} ${address}`.trim();
    }

    if (!query) {
      return NextResponse.json({ candidate: null });
    }

    const candidate = await getGooglePlaceCandidate(query, process.env.GOOGLE_PLACES_API_KEY);
    return NextResponse.json({ success: true, candidate });
  } catch (err: unknown) {
    console.error("Error al buscar candidato en Google Places (GET):", err);
    return NextResponse.json({ candidate: null });
  }
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { data: body, error: bodyError } = await parseBody(req, GoogleReviewsCandidateSchema);
    if (bodyError) return bodyError;

    let query = body.query?.trim() || "";

    // Si no enviaron query explícita, consultar los datos configurados en el local
    if (!query) {
      const { data: settings } = await supabaseAdmin
        .from("business_settings")
        .select("business_name, location_address")
        .eq("id", 1)
        .single();

      const name = settings?.business_name || "";
      const address = settings?.location_address || "";
      query = `${name} ${address}`.trim();
    }

    if (!query) {
      return NextResponse.json({ candidate: null });
    }

    const candidate = await getGooglePlaceCandidate(query, process.env.GOOGLE_PLACES_API_KEY);
    return NextResponse.json({ success: true, candidate });
  } catch (err: unknown) {
    console.error("Error al buscar candidato en Google Places (POST):", err);
    return NextResponse.json({ candidate: null });
  }
}
