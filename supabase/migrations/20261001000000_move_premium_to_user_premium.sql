-- Move premium status off profiles into its own table.
--
-- profiles_user_update only pins `role`, so any signed-in user could PATCH
-- is_premium = true on their own row through PostgREST. user_premium has no
-- write policies at all: the only writer is the Stripe webhook, which uses the
-- service-role client and bypasses RLS.
--
-- A row's existence IS the premium flag — there is no is_premium boolean.

create table public.user_premium (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  purchased_at timestamptz not null default now()
);

alter table public.user_premium enable row level security;

-- Public read: /u/[username] shows a premium badge to visitors, same exposure
-- profiles.is_premium had under profiles_public_select.
create policy user_premium_public_select on public.user_premium
  for select using (true);

revoke insert, update, delete, truncate on public.user_premium from anon, authenticated;

insert into public.user_premium (user_id, purchased_at)
select id, coalesce(premium_purchased_at, now())
from public.profiles
where is_premium;

-- The banner trigger read OLD.is_premium; read the new table instead. Users
-- can't write user_premium, so the same-statement bypass that OLD guarded
-- against no longer exists.
create or replace function public.enforce_premium_banner()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.banner_url is distinct from old.banner_url
     and new.banner_url is not null
     and not exists (select 1 from public.user_premium where user_id = old.id) then
    raise exception 'A custom profile banner requires premium'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$function$;
