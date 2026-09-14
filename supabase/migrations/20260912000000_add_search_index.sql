-- Cross-table keyword search.
--
-- One view unioning every user-facing table into a common shape, plus one RPC
-- that searches it. A VIEW rather than a MATERIALIZED VIEW: at ~9,200 total
-- rows a view over indexed base tables is fast enough, and it can never go
-- stale -- a matview would need a refresh trigger on every admin edit to all
-- 14 source tables, which is far more machinery than the query cost it saves.
--
-- `haystack` is the single matched column: accent-folded via the existing
-- IMMUTABLE unaccent_fallback(), title first, and ALREADY lowercased. The
-- lower() lives in the view, not in the RPC's predicate, so that the stored
-- expression and the query expression are byte-identical -- that is the
-- precondition for the expression indexes at the bottom of this file being
-- usable at all (see the index comment).
--
-- Descriptions are deliberately EXCLUDED -- they are long prose and would
-- flood trigram similarity with weak matches that crowd out real title hits.
--
-- `parent_slug` is null when a row is its own destination, and set when it
-- resolves to a parent page (pieces and evolutions have no page of their own).
--
-- SECURITY_INVOKER = ON is load-bearing and must stay. RLS is decided at the
-- VIEW level, not at the level of the function that queries it: without this
-- option the view executes as its OWNER and the base tables' RLS is skipped
-- entirely, no matter that search_all() below is `security invoker`. custom_looks
-- is SELECT-scoped to `auth.uid() = user_id` with no public policy, so an owner-
-- rights view would publish every user's private looks to every caller.
create or replace view public.search_index with (security_invoker = on) as
  -- Base outfit sets: their own page at /outfits/[slug].
  select 'outfit_set' as kind,
         slug,
         title,
         subtitle,
         image_url,
         null::text as parent_slug,
         null::text as filter_value,
         null::text as filter_category,
         lower(public.unaccent_fallback(
           coalesce(title, '') || ' ' || coalesce(subtitle, '') || ' ' ||
           coalesce(style, '') || ' ' || coalesce(label, '')
         )) as haystack
    from public.outfit_sets
   where base_set is null

  union all

  -- Evolutions have no page of their own; they resolve to their base set.
  select 'outfit_evolution', slug, title, subtitle, image_url, base_set, null::text, null::text,
         lower(public.unaccent_fallback(coalesce(title, '') || ' ' || coalesce(subtitle, '')))
    from public.outfit_sets
   where base_set is not null

  union all

  -- 4,693 of 7,087 outfit_variants have a title and every one is distinct,
  -- so pieces are real search targets rather than noise duplicating the set.
  select 'outfit_piece', slug, title, outfit_category, image_url, outfit_set, null::text, null::text,
         lower(public.unaccent_fallback(coalesce(title, '') || ' ' || coalesce(outfit_category, '')))
    from public.outfit_variants
   where title is not null and btrim(title) <> ''

  union all

  select 'eureka_set', slug, title, style, null::text, null::text, null::text, null::text,
         lower(public.unaccent_fallback(
           coalesce(title, '') || ' ' || coalesce(style, '') || ' ' || coalesce(label, '')
         ))
    from public.eureka_sets

  union all

  -- eureka_variants has NO title column -- compose one from color + category,
  -- and fold the parent set's title into the haystack so a variant is findable
  -- by its set name too ("moon iridescent").
  select 'eureka_variant',
         v.slug,
         initcap(replace(coalesce(v.color, ''), '_', ' ')) || ' ' ||
           initcap(replace(coalesce(v.category, ''), '_', ' ')),
         s.title,
         v.image_url,
         v.eureka_set,
         -- The bare color slug, which is what the detail page's ?color=
         -- validates against -- v.slug is `{set}-{category}-{color}` and
         -- would silently fail that check.
         v.color,
         -- The bare category slug (head/hands/feet), which is the ONLY thing
         -- obtained_eureka.category ever holds. This column exists because the
         -- subtitle above is the parent SET TITLE ("Masked Magic"), and the
         -- obtained toggle used to pass that subtitle as the category -- which
         -- made its scoped DELETE match nothing and then INSERT a junk row with
         -- category = 'Masked Magic', corrupting every countObtained() total.
         -- Null on every other branch: only eureka keys on a category the row
         -- does not already carry in its subtitle.
         v.category,
         lower(public.unaccent_fallback(
           coalesce(s.title, '') || ' ' || coalesce(v.category, '') || ' ' || coalesce(v.color, '')
         ))
    from public.eureka_variants v
    join public.eureka_sets s on s.slug = v.eureka_set

  union all

  select 'makeup_set', slug, title, style, image_url, null::text, null::text, null::text,
         lower(public.unaccent_fallback(coalesce(title, '') || ' ' || coalesce(style, '')))
    from public.makeup_sets

  union all

  select 'makeup_variant', slug, title, makeup_category, image_url, makeup_set, null::text, null::text,
         lower(public.unaccent_fallback(coalesce(title, '') || ' ' || coalesce(makeup_category, '')))
    from public.makeup_variants
   where title is not null and btrim(title) <> ''

  union all

  select 'momo_cloak', slug, title, style, image_url, null::text, null::text, null::text,
         lower(public.unaccent_fallback(coalesce(title, '') || ' ' || coalesce(style, '')))
    from public.momo_cloaks

  union all

  select 'season', slug, title, location, image_url, null::text, null::text, null::text,
         lower(public.unaccent_fallback(coalesce(title, '') || ' ' || coalesce(location, '')))
    from public.seasons

  union all

  select 'trial', slug, title, realm, image_url, null::text, null::text, null::text,
         lower(public.unaccent_fallback(coalesce(title, '') || ' ' || coalesce(realm, '')))
    from public.trials

  union all

  -- custom_looks uses `name`, not `title`.
  select 'custom_look', slug, name, null::text, image_url, null::text, null::text, null::text,
         lower(public.unaccent_fallback(coalesce(name, '')))
    from public.custom_looks

  union all

  -- profiles has no slug; username IS the /u/[username] path segment.
  select 'profile', username, coalesce(display_name, username), null::text, avatar_url,
         null::text, null::text, null::text,
         lower(public.unaccent_fallback(coalesce(display_name, '') || ' ' || coalesce(username, '')))
    from public.profiles;

-- Two passes in one round-trip.
--
-- The fuzzy pass runs ONLY when the strict pass is thin. This is the core
-- behavioral rule: a query with good exact matches never shows mystery
-- results, while a typo still gets rescued. Both constants are calibration
-- knobs expected to need tuning against real queries.
--
-- Written as CTEs rather than a temp table: `create temp table` is DDL, which
-- a STABLE function is not permitted to execute at call time (it would raise
-- at runtime, not at CREATE FUNCTION time). CTEs also let the planner see the
-- whole query at once.
--
-- Every function is schema-qualified, including public.word_similarity() --
-- under `search_path = ''` the bare name does not resolve, and pg_trgm is
-- installed into the public schema on this project.
--
-- `security invoker` here is necessary but NOT sufficient for RLS: the view it
-- reads carries security_invoker = on, which is what actually applies the base
-- tables' policies. See the view comment above.
create or replace function public.search_all(q text)
returns table (
  kind text,
  slug text,
  title text,
  subtitle text,
  image_url text,
  parent_slug text,
  filter_value text,
  filter_category text,
  obtained boolean,
  rank real
)
language sql
security invoker
set search_path to ''
stable
as $function$
  with folded as (
    select public.unaccent_fallback(btrim(lower(coalesce(q, '')))) as term
  ),
  strict_hits as (
    select s.kind, s.slug, s.title, s.subtitle, s.image_url, s.parent_slug,
           s.filter_value, s.filter_category,
           -- A match at position 1 outranks one mid-string, so a prefix hit
           -- sorts above an incidental substring.
           (1.0 / position(f.term in s.haystack))::real as rank
      from public.search_index s, folded f
     where f.term <> ''
       -- s.haystack is already lower(unaccent_fallback(...)) in the view, so
       -- this predicate is the bare column -- which is exactly what the
       -- expression indexes at the bottom of this file store. Wrapping it in
       -- another lower() here would not match those indexes and would force a
       -- sequential scan on every keystroke.
       and s.haystack like '%' || f.term || '%'
  ),
  fuzzy_hits as (
    select s.kind, s.slug, s.title, s.subtitle, s.image_url, s.parent_slug,
           s.filter_value, s.filter_category,
           public.word_similarity(f.term, s.haystack) as rank
      from public.search_index s, folded f
     where f.term <> ''
       -- Rescue pass only: skipped entirely when the strict pass was rich
       -- enough, so a good query never shows weak similarity matches.
       and (select count(*) from strict_hits) < 5
       -- word_similarity(), NOT similarity(). similarity() is whole-string
       -- Jaccard over the two trigram sets, so a short query measured against a
       -- long concatenated haystack can never clear a useful threshold: the
       -- spec's own headline example scored
       --   similarity(unaccent_fallback('Blooming Dreams'), 'blooom') = 0.278
       -- and returned ZERO rows for every typo, invisibly (a typo just looks
       -- like a genuine miss). word_similarity scores the query against the
       -- best-matching WORD-ish extent of the haystack instead:
       --   word_similarity('blooom', 'blooming dreams') = 0.714.
       --
       -- Argument order is REVERSED relative to similarity() and matters: the
       -- short query goes FIRST, the long haystack second.
       --
       -- 0.6 is the calibration knob, measured against the live tables:
       --   'blooom'    -> 122 rows, all genuine "bloom" titles
       --   'iridescnt' -> 2 rows   (0 at 0.7 -- this is why the knob is not 0.7)
       --   'zzzzqqq'   -> 0 rows
       and public.word_similarity(f.term, s.haystack) > 0.6
       and not exists (
         select 1 from strict_hits h where h.kind = s.kind and h.slug = s.slug
       )
  ),
  combined as (
    select * from strict_hits
    union all
    select * from fuzzy_hits
  )
  select c.kind, c.slug, c.title, c.subtitle, c.image_url, c.parent_slug,
         c.filter_value, c.filter_category,
         -- Obtained state for the rows on screen only -- keyed per domain by
         -- the same natural keys the toggle_obtained_* RPCs take. Null for
         -- kinds that are not collectible (seasons, profiles, trials, ...).
         --
         -- The `o.user_id = (select auth.uid())` term is REQUIRED for
         -- correctness, not just for scoping. All four obtained_* tables have a
         -- SELECT policy with qual = true -- they are world-readable -- so an
         -- EXISTS without user_id reports whether ANY user owns the item. That
         -- showed signed-out visitors popular items as already obtained, and
         -- made the toggle destructive: clicking to "un-obtain" an item you do
         -- not own runs a user-scoped DELETE that matches nothing and then
         -- INSERTs, silently ADDING it to your collection.
         --
         -- `(select auth.uid())` rather than bare auth.uid(): the scalar
         -- subquery form lets the planner evaluate it once as an InitPlan
         -- instead of per row (Supabase's documented RLS performance guidance).
         --
         -- The outer `when (select auth.uid()) is null then null` keeps ONE
         -- meaning for null: "render no toggle". Signed out, each EXISTS would
         -- otherwise return false -- a legitimate "you don't own this" -- and
         -- components/search/obtained-toggle.tsx hides itself only on null, so
         -- a signed-out visitor would get a toggle that throws
         -- 'Not authenticated' on click. Deciding it here keeps every consumer
         -- honest instead of making each one re-check auth.
         case
           when (select auth.uid()) is null then null
           when c.kind = 'outfit_piece' then exists (
             select 1 from public.obtained_outfit o
              where o.outfit_set = c.parent_slug
                and o.outfit_variant = c.slug
                and o.user_id = (select auth.uid())
           )
           when c.kind = 'eureka_variant' then exists (
             select 1 from public.obtained_eureka o
              where o.eureka_set = c.parent_slug
                and o.color = c.filter_value
                and o.user_id = (select auth.uid())
           )
           when c.kind = 'makeup_variant' then exists (
             select 1 from public.obtained_makeup o
              where o.makeup_set = c.parent_slug
                and o.makeup_variant = c.slug
                and o.user_id = (select auth.uid())
           )
           when c.kind = 'momo_cloak' then exists (
             select 1 from public.obtained_momo_cloaks o
              where o.momo_cloak = c.slug
                and o.user_id = (select auth.uid())
           )
           else null
         end as obtained,
         c.rank
    from combined c
   order by c.rank desc, c.title asc
   limit 100;
$function$;

grant execute on function public.search_all(text) to anon, authenticated;

-- GIN over gin_trgm_ops serves an unanchored LIKE, so these cover the strict
-- pass -- the one that runs on every keystroke.
--
-- Each index stores the EXACT expression the matching view branch computes for
-- `haystack`, concatenation and all. That precision is the whole point: an
-- expression index only serves a byte-identical expression, so the earlier
-- `unaccent_fallback(title)` indexes could never be used by a query filtering
-- on `lower(unaccent_fallback(title || ' ' || category || ...))`. They were
-- decorative -- six indexes costing write amplification and serving no read.
-- If a view branch's haystack is ever edited, its index below must be edited in
-- the same commit or it silently goes dead again.
--
-- The four small tables (eureka_sets, seasons, trials, momo_cloaks: tens to
-- low hundreds of rows) get no index -- the planner would correctly ignore one
-- at that size, as it already does for the existing profiles trigram indexes.
--
-- The fuzzy pass is deliberately NOT indexed. `word_similarity(term, haystack)`
-- as a function call is not an indexable operator; the indexable spelling is
-- `haystack %> term` (the commutator of `<%`), which reads its threshold from
-- the pg_trgm.word_similarity_threshold session GUC -- not settable from inside
-- a STABLE function with `search_path = ''`, and invisible as a tuning knob.
-- The explicit comparison keeps the threshold a named, reviewable constant. It
-- costs a scan, but only on queries with fewer than 5 strict hits.
create index if not exists outfit_sets_search_trgm
  on public.outfit_sets using gin (
    lower(public.unaccent_fallback(
      coalesce(title, '') || ' ' || coalesce(subtitle, '') || ' ' ||
      coalesce(style, '') || ' ' || coalesce(label, '')
    )) gin_trgm_ops
  );

-- Evolutions are the same physical table as base outfit sets but a different
-- haystack (no style/label), so they need their own index.
create index if not exists outfit_sets_evolution_search_trgm
  on public.outfit_sets using gin (
    lower(public.unaccent_fallback(coalesce(title, '') || ' ' || coalesce(subtitle, ''))) gin_trgm_ops
  );

create index if not exists outfit_variants_search_trgm
  on public.outfit_variants using gin (
    lower(public.unaccent_fallback(
      coalesce(title, '') || ' ' || coalesce(outfit_category, '')
    )) gin_trgm_ops
  );

-- eureka_variants gets NO index on purpose. Its haystack folds in the JOINed
-- parent set title (s.title), and an expression index can only reference
-- columns of its own table -- so any index here would necessarily store a
-- DIFFERENT expression than the view computes and would go unused, which is
-- precisely the defect this block exists to fix. At 456 rows the scan is
-- negligible; if this table grows, the fix is a matview or a denormalized
-- set_title column on eureka_variants, not a mismatched index.

create index if not exists makeup_variants_search_trgm
  on public.makeup_variants using gin (
    lower(public.unaccent_fallback(
      coalesce(title, '') || ' ' || coalesce(makeup_category, '')
    )) gin_trgm_ops
  );
