-- supabase/migrations/20260603000003_add_image_url_to_sets_and_evolutions.sql
-- Add dedicated image_url to outfit_sets and evolutions

alter table public.outfit_sets
  add column image_url text;

alter table public.evolutions
  add column image_url text;
