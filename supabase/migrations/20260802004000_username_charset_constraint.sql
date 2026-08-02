-- Restrict usernames to letters, digits, and underscores.
--
-- The handle is a URL segment (/u/[username]), so characters needing percent-
-- encoding make for ugly, easily-mistyped links — a space in particular round-
-- trips as %20. The settings form is the only place a user sets this, and a
-- maxLength/pattern there is an affordance, not a control: the update goes to
-- PostgREST with the user's own JWT, so enforce the rule in the database.
--
-- Generated handles already satisfy this (generate_username draws from a
-- base62 alphabet), so the constraint only ever bites on hand-edited names.

-- NOT VALID first, then VALIDATE: the check is enforced on every future write
-- immediately, while the scan of existing rows takes a weaker lock. All rows
-- pass today, so validation succeeds — but this ordering keeps the migration
-- safe to re-run against a database that has since acquired a bad row.
alter table public.profiles
  drop constraint if exists profiles_username_charset;

alter table public.profiles
  add constraint profiles_username_charset
  check (username is null or username ~ '^[A-Za-z0-9_]+$')
  not valid;

alter table public.profiles
  validate constraint profiles_username_charset;
