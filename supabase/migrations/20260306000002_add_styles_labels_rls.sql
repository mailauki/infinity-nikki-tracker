-- styles --------------------------------------------------------------------
alter table styles enable row level security;

drop policy if exists styles_read on styles;
create policy styles_read on styles
  for select using (true);

drop policy if exists styles_admin_write on styles;
create policy styles_admin_write on styles
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- labels --------------------------------------------------------------------
alter table labels enable row level security;

drop policy if exists labels_read on labels;
create policy labels_read on labels
  for select using (true);

drop policy if exists labels_admin_write on labels;
create policy labels_admin_write on labels
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
