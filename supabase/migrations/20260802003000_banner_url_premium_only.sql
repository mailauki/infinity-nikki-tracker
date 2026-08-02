-- Restrict custom profile banners to premium users.
--
-- The settings form disables the banner picker for non-premium accounts, but a
-- disabled input is a UI affordance, not a control: the update goes through
-- PostgREST with the user's own JWT, so a hand-rolled request would set
-- banner_url regardless. Enforce it where it cannot be bypassed.
--
-- A trigger rather than an RLS WITH CHECK clause: the profiles UPDATE policy is
-- shared with display_name/username/avatar_url edits, and folding this in would
-- reject those too whenever a non-premium user saved their name.
create or replace function public.enforce_premium_banner()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  -- Only interfere when banner_url actually changes; unrelated profile saves
  -- (display name, username, avatar) pass through untouched.
  -- Check OLD.is_premium: reading the new value would let a single statement
  -- set is_premium and banner_url together and satisfy its own condition.
  if new.banner_url is distinct from old.banner_url
     and new.banner_url is not null
     and not coalesce(old.is_premium, false) then
    raise exception 'A custom profile banner requires premium'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$function$;

drop trigger if exists enforce_premium_banner on public.profiles;
create trigger enforce_premium_banner
  before update on public.profiles
  for each row
  execute function public.enforce_premium_banner();
