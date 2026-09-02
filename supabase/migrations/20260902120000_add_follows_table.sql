-- Follow relationships between profiles.
--
-- Direction convention: follower_id follows following_id. Stated explicitly
-- because both columns are uuid and a reversed read fails silently rather
-- than erroring.
--
-- PRIVACY: follow lists are world-readable, consistent with the decision in
-- 20260802002000_public_profile_read.sql to make profiles and collection
-- progress public. No contact details are exposed; profiles holds no email or
-- auth data.

-- Substring search over usernames needs trigram indexes.
create extension if not exists pg_trgm;

create table public.follows (
  -- FKs reference auth.users, matching feedback.user_id and the obtained_*
  -- tables. Reads join public.profiles on the same id for display.
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  -- Reserved for a future activity feed; nothing reads it yet.
  created_at timestamptz not null default now(),
  -- The composite PK IS the many-to-many join, and it makes follows idempotent
  -- for free: a duplicate follow is a PK violation, not a second row.
  primary key (follower_id, following_id),
  -- Rejected at the schema level, not merely hidden in the UI.
  constraint follows_no_self check (follower_id <> following_id)
);

-- The PK covers "who does X follow" (where follower_id = $1). The reverse
-- direction needs its own index — it runs on every profile page load for the
-- follower count and would otherwise seq-scan.
create index follows_following_id_idx on public.follows (following_id);

-- Support ilike '%q%' on both searchable profile fields.
create index profiles_username_search_idx
  on public.profiles using gin (username gin_trgm_ops);
create index profiles_display_name_search_idx
  on public.profiles using gin (display_name gin_trgm_ops);

alter table public.follows enable row level security;

-- Public read, mirroring the obtained_* pattern from 20260802002000.
create policy follows_public_select on public.follows
  for select using (true);

-- The with check is the security boundary that prevents forging a follow on
-- another user's behalf. Not the UI.
create policy follows_owner_insert on public.follows
  for insert to authenticated
  with check ((select auth.uid()) = follower_id);

-- No UPDATE policy: a follow row has no mutable fields, and unfollow is a
-- DELETE.
create policy follows_owner_delete on public.follows
  for delete to authenticated
  using ((select auth.uid()) = follower_id);
