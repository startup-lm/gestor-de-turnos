import type { PlanName } from "@/lib/flags";

export type ThemeColors = {
  background?: string;
  foreground?: string;
  primary?: string;
  secondary?: string;
  accent?: string;
};

export type GoogleReviewItem = {
  id: string;
  author_name: string;
  author_photo_url?: string;
  author_url?: string;
  rating: number;
  text: string;
  relative_time?: string;
  publish_time?: string;
  visible: boolean;
};

export type GoogleReviewsConfig = {
  enabled?: boolean;
  place_id?: string;
  /** @deprecated ya no se guarda: las reseñas se piden en vivo */
  api_key?: string;
  write_review_url?: string;
  /** @deprecated ya no se guarda: las reseñas se piden en vivo */
  rating?: number;
  /** @deprecated ya no se guarda: las reseñas se piden en vivo */
  user_ratings_total?: number;
  show_in_hero?: boolean;
  show_in_home?: boolean;
  show_in_about?: boolean;
  /** @deprecated ya no se guarda: las reseñas se piden en vivo */
  last_synced_at?: string | null;
  /** @deprecated ya no se guarda: las reseñas se piden en vivo */
  reviews?: GoogleReviewItem[];
  hidden_review_ids?: string[];
};

export type GoogleReviewsData = {
  rating: number | null;
  total: number;
  reviews: GoogleReviewItem[];
  googleMapsUri?: string;
  writeReviewUrl?: string;
};

export type BusinessSettings = {
  slot_step_minutes: 15 | 30 | 45 | 60;
  phone?: string;
  payment_methods?: string[];
  social_media?: { name: string; url: string; active: boolean }[];
  our_story?: string[];
  location_address?: string;
  local_photo?: string;
  assignment_criteria?: "random" | "balanced" | "prioritize_admin" | "prioritize_barber";
  business_name?: string;
  business_logo?: string;
  slogan?: string;
  theme_colors?: ThemeColors;
  /** Plan contratado (lo define el dueño del SaaS). Ver PLAN_FEATURES en lib/flags. */
  plan?: PlanName;
  features?: Record<string, boolean>;
  cash_closing_frequency?: "daily" | "weekly" | "manual";
  google_reviews?: GoogleReviewsConfig;
};