-- supabase/migrations/20260830130000_current_user_has_password.sql
--
-- Whether the calling user has a password set on their account.
--
-- The JS client's User type has no has_password field, and inferring it from
-- the presence of an 'email' identity is wrong -- automatic linking can
-- attach an email identity to an account that never had a password. Reading
-- auth.users directly is the only exact answer.
--
-- This is exposed as a SECURITY DEFINER RPC rather than read via an admin
-- client with `.schema('auth')`: it reads auth.uid() from the caller's own
-- JWT, so it needs no service-role client and takes no user-id parameter --
-- a caller can only ever ask about themselves.

create or replace function public.current_user_has_password()
returns boolean
language sql
security definer
set search_path to ''
stable
as $function$
  select coalesce(
    (select encrypted_password is not null and encrypted_password <> ''
     from auth.users where id = auth.uid()),
    false);
$function$;

revoke all on function public.current_user_has_password() from public;
grant execute on function public.current_user_has_password() to authenticated;
