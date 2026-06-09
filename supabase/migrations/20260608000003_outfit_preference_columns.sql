-- supabase/migrations/20260608000003_outfit_preference_columns.sql
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS outfit_set_filter        text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS outfit_category_filter   text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS outfit_evolution_filter  text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS outfit_rarity_filter     integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS outfit_obtained_filter   text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS outfit_group_by_set      boolean DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS outfit_show_by_evolution boolean DEFAULT FALSE;
