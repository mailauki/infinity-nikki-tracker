-- Lock the avatars bucket to WebP.
--
-- Deliberately split from 20260801120000: that migration had to leave the mime
-- type open so the one-off backfill (scripts/migrate-avatars.mjs) could read the
-- legacy jpg/png objects. The bucket now holds exactly one `{user_id}/avatar.webp`
-- per user, and the upload path re-encodes client-side via fileToWebp(), so the
-- restriction can no longer reject a legitimate upload.

update storage.buckets
  set allowed_mime_types = array['image/webp']
  where id = 'avatars';
