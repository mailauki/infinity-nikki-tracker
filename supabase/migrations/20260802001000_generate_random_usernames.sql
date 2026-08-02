-- Auto-assign a random username to every profile.
--
-- handle_new_user() previously inserted only (id, role), leaving username NULL
-- until the user set one by hand — 65 of 73 existing rows never did, so their
-- public profile at /u/[username] was unreachable. Generate a case-sensitive
-- alphanumeric handle at signup instead, and backfill the existing NULLs.

-- Case-sensitive base62. Excludes look-alike characters (0/O, 1/l/I) so a
-- handle read off a screen can still be typed back correctly.
-- `len`, not `length` — a parameter named `length` would shadow the built-in
-- length() this body calls on the alphabet.
create or replace function public.generate_username(len int default 10)
returns text
language plpgsql
volatile
as $function$
declare
  alphabet constant text :=
    'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  alphabet_len constant int := length(alphabet);
  result text := '';
  i int;
begin
  for i in 1..len loop
    -- gen_random_bytes would need pgcrypto; random() is adequate here because
    -- uniqueness is enforced by the constraint + retry loop, not by entropy alone.
    result := result || substr(alphabet, floor(random() * alphabet_len)::int + 1, 1);
  end loop;
  return result;
end;
$function$;

-- Draw handles until one is free. 57^10 keeps collisions vanishingly rare, but
-- the loop makes correctness independent of that: it retries rather than
-- failing the signup, which a bare INSERT would do on a unique violation.
create or replace function public.generate_unique_username()
returns text
language plpgsql
volatile
set search_path to 'public'
as $function$
declare
  candidate text;
  attempts int := 0;
begin
  loop
    candidate := public.generate_username();
    exit when not exists (select 1 from public.profiles where username = candidate);
    attempts := attempts + 1;
    -- Widen the handle rather than spin forever if the space ever saturates.
    if attempts >= 10 then
      candidate := public.generate_username(16);
      exit;
    end if;
  end loop;
  return candidate;
end;
$function$;

-- Backfill before adding the unique index, so existing NULL rows get a handle
-- and the index has clean data to build on.
update public.profiles
set username = public.generate_unique_username()
where username is null;

-- Enforce uniqueness: /u/[username] resolves a profile with .single(), which
-- errors on duplicates. NULLs are still permitted so a future insert that races
-- the trigger cannot fail outright.
create unique index if not exists profiles_username_key
  on public.profiles (username);

-- Assign the handle at signup, so a profile is reachable at /u/[username] from
-- the moment it exists. Users can still change it later from settings.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
BEGIN
  INSERT INTO public.profiles (id, role, username)
  VALUES (NEW.id, 'user', public.generate_unique_username())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;
