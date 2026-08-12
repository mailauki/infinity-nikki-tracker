-- The feedback bucket only had a SELECT policy for admins, so admin deletion
-- of a feedback report with a screenshot was silently denied by RLS on
-- storage.remove() (and, combined with the "don't delete the row if storage
-- cleanup fails" guard in deleteFeedbackRow, that meant the row could never
-- be deleted either). Mirrors images_admin_delete on the images bucket.
create policy "Admins can delete feedback screenshots"
  on storage.objects for delete
  using (bucket_id = 'feedback' and (select public.is_admin()));
