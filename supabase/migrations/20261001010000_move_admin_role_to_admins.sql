-- Move the admin flag off profiles into its own table.
--
-- profiles had two permissive UPDATE policies. profiles_user_update pinned
-- `role` to a `user_role` JWT claim, but "Enable update for users based on
-- user_id" (from the initial dump, never dropped) did not, and permissive
-- policies OR together — so any signed-in user could PATCH role = 'admin' on
-- their own row. The custom access token hook that would have set `user_role`
-- was never enabled either, so profile saves only ever worked via the
-- unrestricted policy.
--
-- admins has no policies at all: nothing but the service role can read or
-- write it. The app asks the SECURITY DEFINER is_admin() RPC instead, which is
-- also what every admin RLS policy already calls. Grant admin from the SQL
-- editor: insert into public.admins (user_id) values ('<uuid>');

create table public.admins (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

revoke all on public.admins from anon, authenticated;

insert into public.admins (user_id)
select id from public.profiles where role = 'admin';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select exists (
    select 1 from public.admins
    where user_id = (select auth.uid())
  );
$$;

-- Inline role checks from the initial dump. Each table already has an
-- is_admin()-based *_admin_write policy doing the same job.
drop policy if exists "Enable write for admin users only" on public.eureka_sets;
drop policy if exists "Enable write for admin users only" on public.eureka_variants;
drop policy if exists "Enable write for admin users only" on public.trials;

-- One own-row UPDATE policy. With role gone there is nothing left on profiles
-- that a user shouldn't be able to write (banner_url has its own trigger).
drop policy if exists "Enable update for users based on user_id" on public.profiles;
drop policy if exists profiles_user_update on public.profiles;
create policy profiles_user_update on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    public.generate_unique_username(),
    -- NULLIF guards a provider sending an empty string rather than omitting
    -- the key, which would otherwise store '' and render as a blank name.
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'full_name',
                    NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'avatar_url',
                    NEW.raw_user_meta_data->>'picture'), '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;
