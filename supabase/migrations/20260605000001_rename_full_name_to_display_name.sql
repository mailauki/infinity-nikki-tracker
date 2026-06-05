-- supabase/migrations/20260605000001_rename_full_name_to_display_name.sql
-- Rename full_name to display_name on profiles table

alter table public.profiles
  rename column full_name to display_name;
