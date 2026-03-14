-- Fix privilege escalation: the previous profiles_user_policy used FOR ALL,
-- which allowed authenticated users to UPDATE their own role column.
-- Replace with separate SELECT and UPDATE policies; the UPDATE policy asserts
-- that role is unchanged, preventing self-promotion to admin.

drop policy if exists profiles_user_policy on profiles;

-- Users may read their own profile row
drop policy if exists profiles_user_select on profiles;
create policy profiles_user_select on profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

-- Users may update their own profile, but role must remain unchanged.
-- Using JWT claim instead of a sub-select on profiles to avoid infinite recursion
-- in RLS policy evaluation (WITH CHECK cannot re-query the same table safely).
drop policy if exists profiles_user_update on profiles;
create policy profiles_user_update on profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check (
    (select auth.uid()) = id
    and role = (current_setting('request.jwt.claims', true)::jsonb ->> 'user_role')
  );
