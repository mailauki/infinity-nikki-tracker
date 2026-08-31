-- supabase/migrations/20260830120000_oauth_profile_metadata.sql
--
-- Populate display_name and avatar_url from OAuth provider metadata on signup.
--
-- Google supplies full_name/picture; Discord supplies name/avatar_url. The
-- coalesce pairs cover both. An email signup carries neither key, so both
-- columns stay NULL — byte-identical to the previous behavior.
--
-- This fires AFTER INSERT ON auth.users only. Linking a provider to an
-- existing account inserts into auth.identities, not auth.users, so a later
-- link never overwrites a display name or avatar the user chose themselves.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
BEGIN
  INSERT INTO public.profiles (id, role, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    'user',
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
