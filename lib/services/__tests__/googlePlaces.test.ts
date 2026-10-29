import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchGooglePlaceReviews, resolveGooglePlaceId } from "@/lib/services/googlePlaces";

describe("fetchGooglePlaceReviews", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("debe retornar error si no se pasa input", async () => {
    const res = await fetchGooglePlaceReviews({ input: "", apiKey: "test-key" });
    expect(res.success).toBe(false);
    expect(res.error).toContain("link de Google Maps");
  });

  it("resolveGooglePlaceId debe retornar el ID directo si ya tiene formato ChIJ", async () => {
    const directId = "ChIJ12345678901234567890";
    const res = await resolveGooglePlaceId(directId, "test-key");
    expect(res).toBe(directId);
  });

  it("debe retornar error si no se pasa apiKey ni existe en env", async () => {
    const originalKey = process.env.GOOGLE_PLACES_API_KEY;
    delete process.env.GOOGLE_PLACES_API_KEY;

    const res = await fetchGooglePlaceReviews({ input: "ChIJ12345678901234567890", apiKey: "" });
    expect(res.success).toBe(false);
    expect(res.error).toContain("no está configurado en el servidor");

    process.env.GOOGLE_PLACES_API_KEY = originalKey;
  });

  it("debe procesar exitosamente la respuesta de Places API (New) cuando se pasa un Place ID directo", async () => {
    const mockNewApiResponse = {
      rating: 4.8,
      userRatingCount: 85,
      googleMapsUri: "https://maps.google.com/?cid=123",
      reviews: [
        {
          name: "places/123/reviews/1",
          relativePublishTimeDescription: "hace 2 semanas",
          rating: 5,
          text: { text: "Excelente atención y corte perfecto" },
          authorAttribution: {
            displayName: "Esteban Quito",
            photoUri: "https://photo.url/1",
          },
          publishTime: "2026-02-15T12:00:00Z",
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockNewApiResponse,
    } as unknown as Response);

    const res = await fetchGooglePlaceReviews({
      input: "ChIJ12345678901234567890",
      apiKey: "AIzaFakeKey",
    });

    expect(res.success).toBe(true);
    expect(res.data?.rating).toBe(4.8);
    expect(res.data?.user_ratings_total).toBe(85);
    expect(res.data?.reviews).toHaveLength(1);
    expect(res.data?.reviews?.[0]?.author_name).toBe("Esteban Quito");
    expect(res.data?.reviews?.[0]?.rating).toBe(5);
    expect(res.data?.reviews?.[0]?.visible).toBe(true);
  });

  it("debe resolver automáticamente un link de Google Maps y obtener el Place ID", async () => {
    const mockTextSearchResponse = {
      places: [
        {
          id: "ChIJResolvedPlaceId12345",
          displayName: { text: "Hellfish Barbería" },
          formattedAddress: "Av. Corrientes 1234, Buenos Aires",
        },
      ],
    };

    const mockDetailsResponse = {
      rating: 5.0,
      userRatingCount: 150,
      reviews: [],
    };

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTextSearchResponse,
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetailsResponse,
      } as unknown as Response);

    const res = await fetchGooglePlaceReviews({
      input: "Hellfish Barberia Buenos Aires",
      apiKey: "AIzaFakeKey",
    });

    expect(res.success).toBe(true);
    expect(res.data?.place_id).toBe("ChIJResolvedPlaceId12345");
  });

  it("debe caer al fallback de Places API (Legacy) si la nueva falla", async () => {
    const mockLegacyResponse = {
      status: "OK",
      result: {
        rating: 4.9,
        user_ratings_total: 120,
        reviews: [
          {
            author_name: "Carlos Saul",
            profile_photo_url: "https://photo.url/2",
            rating: 5,
            relative_time_description: "hace un mes",
            text: "El mejor salón de la zona",
            time: 1700000000,
          },
        ],
      },
    };

    // Primera llamada (New API) falla con 404, segunda (Legacy) responde OK
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockLegacyResponse,
      } as unknown as Response);

    const res = await fetchGooglePlaceReviews({
      input: "ChIJ12345678901234567890",
      apiKey: "AIzaFakeKey",
    });

    expect(res.success).toBe(true);
    expect(res.data?.rating).toBe(4.9);
    expect(res.data?.user_ratings_total).toBe(120);
    expect(res.data?.reviews?.[0]?.author_name).toBe("Carlos Saul");
  });
});
