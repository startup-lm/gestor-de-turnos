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
  rating: number;
  text: string;
  relative_time?: string;
  publish_time?: string;
  visible: boolean;
};

export type GoogleReviewsConfig = {
  enabled?: boolean;
  place_id?: string;
  api_key?: string;
  write_review_url?: string;
  rating?: number;
  user_ratings_total?: number;
  show_in_hero?: boolean;
  show_in_home?: boolean;
  show_in_about?: boolean;
  last_synced_at?: string | null;
  reviews?: GoogleReviewItem[];
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
  features?: Record<string, boolean>;
  cash_closing_frequency?: "daily" | "weekly" | "manual";
  google_reviews?: GoogleReviewsConfig;
};