-- Fix privilege escalation: the previous profiles_user_policy used FOR ALL,
-- which allowed authenticated users to UPDATE their own role column.
-- Replace with separate SELECT and UPDATE policies; the UPDATE policy asserts
-- that role is unchanged, preventing self-promotion to admin.

drop policy if exists profiles_user_policy on profiles;

-- Users may read their own profile row
create policy profiles_user_select on profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

-- Users may update their own profile, but role must remain unchanged
create policy profiles_user_update on profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check (
    (select auth.uid()) = id
    and role = (select role from public.profiles where id = (select auth.uid()))
  );
