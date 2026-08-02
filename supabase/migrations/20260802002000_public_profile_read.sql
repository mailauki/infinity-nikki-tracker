-- Make profiles and collection progress publicly readable.
--
-- /u/[username] renders another user's profile — identity plus collection stats.
-- Until now SELECT on profiles was "authenticated AND own row", and obtained_*
-- was owner-only, so the page could never load for anyone but the owner (the
-- old is_premium gate hid this by 404-ing before the query ran).
--
-- PRIVACY: this makes every user's collection world-readable. Writes stay
-- owner-only, and no contact details are exposed — profiles holds no email or
-- auth data; those live in auth.users, which is not reachable via PostgREST.

-- ---- profiles -------------------------------------------------------------
-- Replace the overlapping own-row SELECT policies with a single public one.
-- Postgres ORs multiple permissive policies together, so leaving the old
-- authenticated-only ones in place would be harmless but misleading.
drop policy if exists "Enable users to view their own data only" on public.profiles;
drop policy if exists profiles_user_select on public.profiles;

drop policy if exists profiles_public_select on public.profiles;
create policy profiles_public_select on public.profiles
  for select using (true);

-- ---- obtained_eureka ------------------------------------------------------
-- The blanket ALL policy also covered SELECT; narrow it to the write commands
-- so reads can be public while inserts/updates/deletes stay owner-scoped.
drop policy if exists "Enable users to view their own data only" on public.obtained_eureka;
drop policy if exists obtained_user_policy on public.obtained_eureka;

drop policy if exists obtained_eureka_public_select on public.obtained_eureka;
create policy obtained_eureka_public_select on public.obtained_eureka
  for select using (true);

drop policy if exists obtained_eureka_owner_insert on public.obtained_eureka;
create policy obtained_eureka_owner_insert on public.obtained_eureka
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists obtained_eureka_owner_update on public.obtained_eureka;
create policy obtained_eureka_owner_update on public.obtained_eureka
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists obtained_eureka_owner_delete on public.obtained_eureka;
create policy obtained_eureka_owner_delete on public.obtained_eureka
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---- obtained_outfit ------------------------------------------------------
drop policy if exists obtained_outfit_user_policy on public.obtained_outfit;

drop policy if exists obtained_outfit_public_select on public.obtained_outfit;
create policy obtained_outfit_public_select on public.obtained_outfit
  for select using (true);

drop policy if exists obtained_outfit_owner_insert on public.obtained_outfit;
create policy obtained_outfit_owner_insert on public.obtained_outfit
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists obtained_outfit_owner_update on public.obtained_outfit;
create policy obtained_outfit_owner_update on public.obtained_outfit
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists obtained_outfit_owner_delete on public.obtained_outfit;
create policy obtained_outfit_owner_delete on public.obtained_outfit
  for delete to authenticated
  using ((select auth.uid()) = user_id);
