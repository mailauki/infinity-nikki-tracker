-- supabase/migrations/20260611000003_add_sort_order_preference.sql
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS sort_order text DEFAULT 'new';
