import { GoogleReviewItem, GoogleReviewsConfig } from "@/lib/types/BusinessSettings";

export interface GooglePlaceCandidate {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
}

interface FetchGoogleReviewsParams {
  input: string; // Puede ser un Place ID (ChIJ...), un link de Google Maps o el nombre/dirección
  apiKey?: string;
}

interface FetchGoogleReviewsResult {
  success: boolean;
  data?: Partial<GoogleReviewsConfig>;
  error?: string;
}

interface GooglePlacesNewReview {
  name?: string;
  rating?: number;
  relativePublishTimeDescription?: string;
  publishTime?: string;
  text?: { text?: string };
  originalText?: { text?: string };
  authorAttribution?: {
    displayName?: string;
    photoUri?: string;
    uri?: string;
  };
}

interface GooglePlacesLegacyReview {
  author_name?: string;
  profile_photo_url?: string;
  rating?: number;
  relative_time_description?: string;
  text?: string;
  time?: number;
}

/**
 * Resuelve automáticamente el Google Place ID a partir de:
 * 1. Un Place ID directo (ej: ChIJN1t_tDeuEmsRUsoyG83frY4)
 * 2. Un link de Google Maps (incluyendo links cortos maps.app.goo.gl)
 * 3. El nombre o dirección del local mediante Google Places Text Search.
 */
export async function resolveGooglePlaceId(input: string, apiKey: string): Promise<string | null> {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Si ya es un Place ID directo
  if (/^ChIJ[A-Za-z0-9_-]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  const candidate = await getGooglePlaceCandidate(trimmed, apiKey);
  return candidate?.place_id || null;
}

/**
 * Busca un local candidato en Google Places devolviendo su nombre oficial, dirección, estrellas y place_id.
 */
export async function getGooglePlaceCandidate(
  input: string,
  apiKey?: string
): Promise<GooglePlaceCandidate | null> {
  const cleanInput = input.trim();
  const key = (apiKey?.trim() || process.env.GOOGLE_PLACES_API_KEY || "").trim();
  if (!cleanInput || !key) return null;

  let searchQuery = cleanInput;

  // Si ya es un Place ID directo
  if (/^ChIJ[A-Za-z0-9_-]{20,}$/.test(cleanInput)) {
    try {
      const res = await fetch(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(cleanInput)}?languageCode=es`,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": key,
            "X-Goog-FieldMask": "id,displayName,formattedAddress,rating,userRatingCount",
          },
        }
      );
      if (res.ok) {
        const p = await res.json();
        return {
          place_id: cleanInput,
          name: p.displayName?.text || cleanInput,
          formatted_address: p.formattedAddress || "",
          rating: typeof p.rating === "number" ? p.rating : 5.0,
          user_ratings_total: typeof p.userRatingCount === "number" ? p.userRatingCount : 0,
        };
      }
    } catch (e) {
      console.warn("Fallo al resolver Place ID directo como candidato:", e);
    }
  }

  // Si es una URL de Google Maps
  if (cleanInput.startsWith("http://") || cleanInput.startsWith("https://")) {
    try {
      let finalUrl = cleanInput;

      // Seguir redirecciones si es un enlace corto (maps.app.goo.gl o goo.gl/maps)
      if (cleanInput.includes("goo.gl") || cleanInput.includes("maps.app")) {
        const headRes = await fetch(cleanInput, { method: "GET", redirect: "follow" });
        finalUrl = headRes.url || cleanInput;
      }

      // Buscar si el placeId está explícito en la URL (?place_id=ChIJ... o !1sChIJ...)
      const directPlaceMatch = finalUrl.match(/(?:place_id=|!1s)(ChIJ[A-Za-z0-9_-]{20,})/);
      if (directPlaceMatch?.[1]) {
        searchQuery = directPlaceMatch[1];
      } else {
        // Extraer nombre del local desde la ruta /maps/place/Nombre+Del+Local/
        const placeNameMatch = finalUrl.match(/\/maps\/place\/([^/@?]+)/);
        if (placeNameMatch?.[1]) {
          searchQuery = decodeURIComponent(placeNameMatch[1].replace(/\+/g, " "));
        } else {
          const urlObj = new URL(finalUrl);
          const q = urlObj.searchParams.get("query") || urlObj.searchParams.get("q");
          if (q) searchQuery = q;
        }
      }
    } catch (e) {
      console.warn("No se pudo expandir la URL de Google Maps, usando texto crudo:", e);
    }
  }

  // 1. Buscar en Places API (New: searchText)
  try {
    const textSearchUrl = "https://places.googleapis.com/v1/places:searchText";
    const res = await fetch(textSearchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount",
      },
      body: JSON.stringify({
        textQuery: searchQuery,
        languageCode: "es",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.places) && data.places.length > 0 && data.places[0].id) {
        const p = data.places[0];
        return {
          place_id: p.id,
          name: p.displayName?.text || searchQuery,
          formatted_address: p.formattedAddress || "",
          rating: typeof p.rating === "number" ? p.rating : 5.0,
          user_ratings_total: typeof p.userRatingCount === "number" ? p.userRatingCount : 0,
        };
      }
    }
  } catch (err) {
    console.warn("Fallo en places:searchText (New), intentando con findplacefromtext (Legacy):", err);
  }

  // 2. Fallback a Find Place from Text (Legacy)
  try {
    const legacyUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
      searchQuery
    )}&inputtype=textquery&fields=place_id,name,formatted_address,rating,user_ratings_total&language=es&key=${encodeURIComponent(
      key
    )}`;

    const res = await fetch(legacyUrl, { method: "GET" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.candidates) && data.candidates.length > 0 && data.candidates[0].place_id) {
        const c = data.candidates[0];
        return {
          place_id: c.place_id,
          name: c.name || searchQuery,
          formatted_address: c.formatted_address || "",
          rating: typeof c.rating === "number" ? c.rating : 5.0,
          user_ratings_total: typeof c.user_ratings_total === "number" ? c.user_ratings_total : 0,
        };
      }
    }
  } catch (err) {
    console.error("Error buscando candidato en Google Places API:", err);
  }

  return null;
}

/**
 * Consulta la API de Google Places para obtener información oficial de reseñas.
 * Resuelve automáticamente links o nombres si no se pasa un Place ID directo.
 */
export async function fetchGooglePlaceReviews({
  input,
  apiKey,
}: FetchGoogleReviewsParams): Promise<FetchGoogleReviewsResult> {
  const rawInput = input.trim();
  const key = (apiKey?.trim() || process.env.GOOGLE_PLACES_API_KEY || "").trim();

  if (!rawInput) {
    return {
      success: false,
      error: "Ingresá el link de Google Maps, el nombre o el Place ID de tu local.",
    };
  }

  if (!key) {
    return {
      success: false,
      error: "El servicio de reseñas no está configurado en el servidor (falta GOOGLE_PLACES_API_KEY en variables de entorno).",
    };
  }

  // Resolver Place ID si no es un código directo
  let placeId = rawInput;
  if (!/^ChIJ[A-Za-z0-9_-]{20,}$/.test(rawInput)) {
    const resolved = await resolveGooglePlaceId(rawInput, key);
    if (!resolved) {
      return {
        success: false,
        error: `No se encontró ningún local en Google Maps para "${rawInput}". Verificá el link o nombre ingresado.`,
      };
    }
    placeId = resolved;
  }

  const defaultWriteUrl = `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;

  // 1. Intentar con Google Places API (New)
  try {
    const newApiUrl = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=es`;
    const res = await fetch(newApiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "rating,userRatingCount,reviews,displayName,googleMapsUri",
      },
      next: { revalidate: 0 },
    });

    if (res.ok) {
      const data = await res.json();
      const rating = typeof data.rating === "number" ? data.rating : 5.0;
      const total = typeof data.userRatingCount === "number" ? data.userRatingCount : 0;
      const writeUrl = defaultWriteUrl;

      const rawReviews: GooglePlacesNewReview[] = Array.isArray(data.reviews) ? data.reviews : [];
      const reviews: GoogleReviewItem[] = rawReviews
        .filter((r) => Boolean((r.text?.text || r.originalText?.text || "").trim()))
        .map((r, idx) => ({
          id: r.name || `rev-new-${idx}-${Date.now()}`,
          author_name: r.authorAttribution?.displayName || "Cliente de Google",
          author_photo_url: r.authorAttribution?.photoUri || undefined,
          rating: typeof r.rating === "number" ? r.rating : 5,
          text: (r.text?.text || r.originalText?.text || "").trim(),
          relative_time: r.relativePublishTimeDescription || "",
          publish_time: r.publishTime || undefined,
          visible: true,
        }));

      return {
        success: true,
        data: {
          place_id: placeId,
          rating,
          user_ratings_total: total,
          write_review_url: writeUrl,
          last_synced_at: new Date().toISOString(),
          reviews,
        },
      };
    }
  } catch (err) {
    console.warn("Fallo en Places API (New), intentando con API Legacy:", err);
  }

  // 2. Fallback a Google Places API (Legacy Details)
  try {
    const legacyUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
      placeId
    )}&fields=rating,user_ratings_total,reviews,url&language=es&key=${encodeURIComponent(key)}`;

    const res = await fetch(legacyUrl, {
      method: "GET",
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return {
        success: false,
        error: `Error HTTP al contactar Google Places: ${res.status} ${res.statusText}`,
      };
    }

    const data = await res.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return {
        success: false,
        error: data.error_message || `Google Places retornó estado: ${data.status}`,
      };
    }

    const result = data.result || {};
    const rating = typeof result.rating === "number" ? result.rating : 5.0;
    const total = typeof result.user_ratings_total === "number" ? result.user_ratings_total : 0;
    const writeUrl = defaultWriteUrl;

    const rawReviews: GooglePlacesLegacyReview[] = Array.isArray(result.reviews) ? result.reviews : [];
    const reviews: GoogleReviewItem[] = rawReviews
      .filter((r) => Boolean(r.text?.trim()))
      .map((r, idx) => ({
        id: `rev-legacy-${idx}-${r.time || Date.now()}`,
        author_name: r.author_name || "Cliente de Google",
        author_photo_url: r.profile_photo_url || undefined,
        rating: typeof r.rating === "number" ? r.rating : 5,
        text: r.text?.trim() || "",
        relative_time: r.relative_time_description || "",
        publish_time: r.time ? new Date(r.time * 1000).toISOString() : undefined,
        visible: true,
      }));

    return {
      success: true,
      data: {
        place_id: placeId,
        rating,
        user_ratings_total: total,
        write_review_url: writeUrl,
        last_synced_at: new Date().toISOString(),
        reviews,
      },
    };
  } catch (err: unknown) {
    console.error("Error al sincronizar con Google Places:", err);
    const msg = err instanceof Error ? err.message : "Error de red al comunicarse con Google Places API.";
    return {
      success: false,
      error: msg,
    };
  }
}
