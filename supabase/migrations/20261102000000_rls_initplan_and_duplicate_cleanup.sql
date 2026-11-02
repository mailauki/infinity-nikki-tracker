-- Performance-advisor cleanup. Behaviour-preserving: every policy keeps the same
-- predicate, every dropped object has an identical twin that stays.

-- 1. auth_rls_initplan: `auth.uid()` bare in a policy is re-evaluated per row;
--    wrapped in a scalar sub-select it is evaluated once per statement.
alter policy "Users can read own looks" on public.custom_looks
  using ((select auth.uid()) = user_id);
alter policy "Users can insert own looks" on public.custom_looks
  with check ((select auth.uid()) = user_id);
alter policy "Users can update own looks" on public.custom_looks
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "Users can delete own looks" on public.custom_looks
  using ((select auth.uid()) = user_id);

alter policy "Users can read their own preferences" on public.user_preferences
  using ((select auth.uid()) = user_id);
alter policy "Users can insert their own preferences" on public.user_preferences
  with check ((select auth.uid()) = user_id);
alter policy "Users can update their own preferences" on public.user_preferences
  using ((select auth.uid()) = user_id);

alter policy "Users can read own admin preferences" on public.admin_preferences
  using ((select auth.uid()) = user_id);
alter policy "Users can insert own admin preferences" on public.admin_preferences
  with check ((select auth.uid()) = user_id);
alter policy "Users can update own admin preferences" on public.admin_preferences
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- 2. multiple_permissive_policies: legacy dashboard-created policies that
--    duplicate a newer one exactly (permissive policies OR together, so each
--    extra one is evaluated for nothing).
--    Public read: each table also has `<table>_read` USING (true).
drop policy "Enable read access for all users" on public.eureka_categories;
drop policy "Enable read access for all users" on public.eureka_colors;
drop policy "Enable read access for all users" on public.eureka_sets;
drop policy "Enable read access for all users" on public.eureka_variants;
drop policy "Enable read access for all users" on public.labels;
drop policy "Enable read access for all users" on public.styles;
drop policy "Enable read access for all users" on public.trials;
--    obtained_eureka owner writes: obtained_eureka_owner_{insert,delete} carry
--    the same predicate for `authenticated`; the legacy ones were granted to
--    `public`, but anon has no uid so they could never pass for it.
drop policy "Enable insert for users based on user_id" on public.obtained_eureka;
drop policy "Enable delete for users based on user_id" on public.obtained_eureka;

-- 3. duplicate_index: identical unique indexes on obtained_eureka; the
--    `obtained_eureka_` one (the table's current name) stays. Neither backs a
--    constraint. On eureka_colors, colors_slug_key and colors_pkey are also
--    identical, but colors_slug_key backs two FKs, so it stays; the third,
--    non-unique colors_slug_idx is redundant with both.
drop index public.obtained_unique_item_idx;
drop index public.colors_slug_idx;

-- 4. unindexed_foreign_keys: eureka set deletes/renames cascade into
--    obtained_eureka by eureka_set, which otherwise scans every user's rows.
--    The other flagged FKs point at small lookup tables and are left alone.
create index if not exists obtained_eureka_eureka_set_idx
  on public.obtained_eureka (eureka_set);
