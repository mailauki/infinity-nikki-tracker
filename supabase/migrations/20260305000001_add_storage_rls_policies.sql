-- Storage RLS for images bucket
-- Public read: images are displayed to all users (authenticated and anonymous)
-- Admin write: only admins may upload, update, or delete images

drop policy if exists images_public_read on storage.objects;
create policy images_public_read on storage.objects
  for select using (bucket_id = 'images');

drop policy if exists images_admin_insert on storage.objects;
create policy images_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'images' and (select public.is_admin()));

drop policy if exists images_admin_update on storage.objects;
create policy images_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'images' and (select public.is_admin()))
  with check (bucket_id = 'images' and (select public.is_admin()));

drop policy if exists images_admin_delete on storage.objects;
create policy images_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'images' and (select public.is_admin()));
