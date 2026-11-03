import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPublicGoogleReviews } from "../getPublicGoogleReviews";
import * as googlePlacesService from "@/lib/services/googlePlaces";
import type { GoogleReviewItem } from "@/lib/types/BusinessSettings";

vi.mock("@/lib/services/googlePlaces", () => ({
  fetchGooglePlaceReviews: vi.fn(),
}));

describe("getPublicGoogleReviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve null si no hay place_id", async () => {
    const result = await getPublicGoogleReviews({});
    expect(result).toBeNull();
    expect(googlePlacesService.fetchGooglePlaceReviews).not.toHaveBeenCalled();
  });

  it("devuelve null si enabled es false", async () => {
    const result = await getPublicGoogleReviews({
      place_id: "ChIJ1234567890",
      enabled: false,
    });
    expect(result).toBeNull();
    expect(googlePlacesService.fetchGooglePlaceReviews).not.toHaveBeenCalled();
  });

  it("descarta reseñas ocultas en hidden_review_ids y reseñas que comiencen con manual-", async () => {
    const mockReviews: GoogleReviewItem[] = [
      {
        id: "r1",
        author_name: "Usuario 1",
        rating: 5,
        text: "Excelente",
        visible: true,
      },
      {
        id: "r2",
        author_name: "Usuario 2",
        rating: 4,
        text: "Bueno",
        visible: true,
      },
      {
        id: "manual-1",
        author_name: "Manual User",
        rating: 5,
        text: "Manual",
        visible: true,
      },
    ];

    vi.mocked(googlePlacesService.fetchGooglePlaceReviews).mockResolvedValueOnce({
      success: true,
      data: {
        place_id: "ChIJ1234567890",
        rating: 4.8,
        user_ratings_total: 120,
        write_review_url: "https://search.google.com/local/writereview?placeid=ChIJ1234567890",
        googleMapsUri: "https://maps.google.com/?cid=123",
        reviews: mockReviews,
      },
    });

    const result = await getPublicGoogleReviews({
      place_id: "ChIJ1234567890",
      enabled: true,
      hidden_review_ids: ["r2"],
    });

    expect(result).not.toBeNull();
    expect(result?.rating).toBe(4.8);
    expect(result?.total).toBe(120);
    expect(result?.googleMapsUri).toBe("https://maps.google.com/?cid=123");
    expect(result?.writeReviewUrl).toBe("https://search.google.com/local/writereview?placeid=ChIJ1234567890");
    expect(result?.reviews).toEqual([mockReviews[0]]);
    expect(googlePlacesService.fetchGooglePlaceReviews).toHaveBeenCalledWith({
      input: "ChIJ1234567890",
      apiKey: undefined,
      revalidateSeconds: 86400,
    });
  });

  it("devuelve null sin romper si el servicio retorna error o falla", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(googlePlacesService.fetchGooglePlaceReviews).mockResolvedValueOnce({
      success: false,
      error: "Google Places API no disponible",
    });

    const result = await getPublicGoogleReviews({
      place_id: "ChIJ1234567890",
      enabled: true,
    });

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("devuelve null sin romper si fetchGooglePlaceReviews lanza una excepción", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(googlePlacesService.fetchGooglePlaceReviews).mockRejectedValueOnce(
      new Error("Network connection lost")
    );

    const result = await getPublicGoogleReviews({
      place_id: "ChIJ1234567890",
      enabled: true,
    });

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
