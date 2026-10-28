export type ThemeColors = {
  background?: string;
  foreground?: string;
  primary?: string;
  secondary?: string;
  accent?: string;
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
};