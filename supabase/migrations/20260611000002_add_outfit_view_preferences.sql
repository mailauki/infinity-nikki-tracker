-- supabase/migrations/20260611000002_add_outfit_view_preferences.sql
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS outfit_image_mode text DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS outfit_density    text DEFAULT 'standard';
