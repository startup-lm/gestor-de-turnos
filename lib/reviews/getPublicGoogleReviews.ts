import { fetchGooglePlaceReviews } from "@/lib/services/googlePlaces";
import type { GoogleReviewsConfig, GoogleReviewsData } from "@/lib/types/BusinessSettings";

/**
 * Obtiene las reseñas públicas de Google en vivo desde Places API.
 * Aplica moderación (oculta reseñas marcadas por el comercio y reseñas manuales legacy).
 * Se ejecuta exclusivamente en el servidor con revalidación de 24 horas.
 */
export async function getPublicGoogleReviews(
  config?: GoogleReviewsConfig
): Promise<GoogleReviewsData | null> {
  if (!config?.place_id || config.enabled === false) {
    return null;
  }

  try {
    const result = await fetchGooglePlaceReviews({
      input: config.place_id,
      apiKey: config.api_key,
      revalidateSeconds: 86400,
    });

    if (!result.success || !result.data) {
      console.error("Error al obtener reseñas de Google Places:", result.error);
      return null;
    }

    const hiddenIds = new Set(config.hidden_review_ids || []);
    const rawReviews = result.data.reviews || [];
    const filteredReviews = rawReviews.filter(
      (r) => !hiddenIds.has(r.id) && !r.id.startsWith("manual-")
    );

    const data: GoogleReviewsData = {
      rating: typeof result.data.rating === "number" ? result.data.rating : null,
      total: typeof result.data.user_ratings_total === "number" ? result.data.user_ratings_total : 0,
      reviews: filteredReviews,
      googleMapsUri: result.data.googleMapsUri,
      writeReviewUrl: config.write_review_url || result.data.write_review_url,
    };

    return data;
  } catch (error) {
    console.error("Excepción inesperada al obtener reseñas públicas de Google:", error);
    return null;
  }
}
