export type BusinessSettings = {
  slot_step_minutes: 15 | 30 | 45 | 60;
  phone?: string;
  social_media?: { name: string; url: string; active: boolean }[];
  our_story?: string[];
  location_address?: string;
  local_photo?: string;
};