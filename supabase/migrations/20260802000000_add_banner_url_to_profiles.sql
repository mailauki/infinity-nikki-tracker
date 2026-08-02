-- Profile banner (the hero image behind the profile card).
--
-- Mirrors avatar_url: a full public URL into the `avatars` bucket, stored at the
-- stable path {user_id}/banner.webp so a re-upload upserts over the previous
-- object instead of orphaning it. NULL means "use the app's default hero art",
-- which is what every existing row falls back to.
alter table public.profiles
  add column if not exists banner_url text;

comment on column public.profiles.banner_url is
  'Public URL of the user''s profile banner in the avatars bucket ({user_id}/banner.webp). NULL falls back to the default hero image.';
