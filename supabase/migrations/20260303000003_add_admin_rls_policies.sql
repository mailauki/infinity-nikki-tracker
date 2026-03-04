-- Security definer helper: checks if the current user has the admin role.
-- Runs as the function owner (bypasses RLS on profiles), so the profiles
-- table RLS does not block the lookup. auth.uid() is wrapped in SELECT to
-- cache the result for the lifetime of the query rather than re-evaluating
-- per row (see RLS performance recommendations).
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

-- eureka_sets ---------------------------------------------------------------
alter table eureka_sets enable row level security;

-- Public game data: anyone (including anonymous) can read
drop policy if exists eureka_sets_read on eureka_sets;
create policy eureka_sets_read on eureka_sets
  for select using (true);

-- Only admins may insert / update / delete
drop policy if exists eureka_sets_admin_write on eureka_sets;
create policy eureka_sets_admin_write on eureka_sets
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- eureka_variants -----------------------------------------------------------
alter table eureka_variants enable row level security;

drop policy if exists eureka_variants_read on eureka_variants;
create policy eureka_variants_read on eureka_variants
  for select using (true);

drop policy if exists eureka_variants_admin_write on eureka_variants;
create policy eureka_variants_admin_write on eureka_variants
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- trials --------------------------------------------------------------------
alter table trials enable row level security;

drop policy if exists trials_read on trials;
create policy trials_read on trials
  for select using (true);

drop policy if exists trials_admin_write on trials;
create policy trials_admin_write on trials
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- categories ----------------------------------------------------------------
alter table categories enable row level security;

drop policy if exists categories_read on categories;
create policy categories_read on categories
  for select using (true);

drop policy if exists categories_admin_write on categories;
create policy categories_admin_write on categories
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- colors --------------------------------------------------------------------
alter table colors enable row level security;

drop policy if exists colors_read on colors;
create policy colors_read on colors
  for select using (true);

drop policy if exists colors_admin_write on colors;
create policy colors_admin_write on colors
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
