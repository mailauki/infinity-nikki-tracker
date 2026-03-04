-- RLS for obtained: users may only read/write their own collection records
alter table obtained enable row level security;
alter table obtained force row level security;

drop policy if exists obtained_user_policy on obtained;
create policy obtained_user_policy on obtained
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- RLS for profiles: users may only read/update their own profile
alter table profiles enable row level security;
alter table profiles force row level security;

drop policy if exists profiles_user_policy on profiles;
create policy profiles_user_policy on profiles
  for all
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
