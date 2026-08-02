-- Storage RLS for the avatars bucket
-- Public read: avatars are shown on public profiles (/u/[username]) to everyone,
-- authenticated or not. Writes stay scoped to the owning user's folder, where
-- the first path segment is the user's auth.uid().
--
-- Replaces the dashboard-generated "Give users access to own folder 1oj01fe_*"
-- policies, which also restricted SELECT to the owner. The bucket was already
-- `public = true`, so the CDN path (/object/public/avatars/...) never consulted
-- RLS — but the authenticated API path (.download()/.list()) did, which is why
-- one user could not load another user's avatar.

-- Read: anyone, matching images_public_read.
drop policy if exists "Give users access to own folder 1oj01fe_0" on storage.objects;
drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read on storage.objects
  for select using (bucket_id = 'avatars');

-- Write: only the user whose id matches the first folder segment.
drop policy if exists "Give users access to own folder 1oj01fe_1" on storage.objects;
drop policy if exists avatars_owner_insert on storage.objects;
create policy avatars_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (select auth.uid()::text) = (storage.foldername(name))[1]
  );

-- Update needs `with check` as well as `using`; the old policy had only `using`,
-- so an upsert that rewrote the object could move it out of the owner's folder.
-- Required now that uploads use upsert onto a stable avatar.webp path.
drop policy if exists "Give users access to own folder 1oj01fe_2" on storage.objects;
drop policy if exists avatars_owner_update on storage.objects;
create policy avatars_owner_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (select auth.uid()::text) = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatars'
    and (select auth.uid()::text) = (storage.foldername(name))[1]
  );

drop policy if exists "Give users access to own folder 1oj01fe_3" on storage.objects;
drop policy if exists avatars_owner_delete on storage.objects;
create policy avatars_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (select auth.uid()::text) = (storage.foldername(name))[1]
  );

-- The bucket is already public = true; assert it rather than assume.
-- `allowed_mime_types` is deliberately NOT restricted to image/webp here: the
-- legacy jpg/png objects still exist at this point and the one-off backfill
-- (scripts/migrate-avatars.mjs) needs to read them. A follow-up migration locks
-- the mime type down once the bucket holds only avatar.webp objects.
update storage.buckets
  set public = true,
      file_size_limit = 5242880 -- 5 MB; sources are re-encoded to WebP client-side
  where id = 'avatars';
