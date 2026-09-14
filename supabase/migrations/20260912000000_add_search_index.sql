-- Cross-table keyword search.
--
-- One view unioning every user-facing table into a common shape, plus one RPC
-- that searches it. A VIEW rather than a MATERIALIZED VIEW: at ~9,200 total
-- rows a view over indexed base tables is fast enough, and it can never go
-- stale -- a matview would need a refresh trigger on every admin edit to all
-- 14 source tables, which is far more machinery than the query cost it saves.
--
-- `haystack` is the single matched column: accent-folded via the existing
-- IMMUTABLE unaccent_fallback(), title first. Descriptions are deliberately
-- EXCLUDED -- they are long prose and would flood trigram similarity with
-- weak matches that crowd out real title hits.
--
-- `parent_slug` is null when a row is its own destination, and set when it
-- resolves to a parent page (pieces and evolutions have no page of their own).

create or replace view public.search_index as
  -- Base outfit sets: their own page at /outfits/[slug].
  select 'outfit_set' as kind,
         slug,
         title,
         subtitle,
         image_url,
         null::text as parent_slug,
         null::text as filter_value,
         public.unaccent_fallback(
           coalesce(title, '') || ' ' || coalesce(subtitle, '') || ' ' ||
           coalesce(style, '') || ' ' || coalesce(label, '')
         ) as haystack
    from public.outfit_sets
   where base_set is null

  union all

  -- Evolutions have no page of their own; they resolve to their base set.
  select 'outfit_evolution', slug, title, subtitle, image_url, base_set, null::text,
         public.unaccent_fallback(coalesce(title, '') || ' ' || coalesce(subtitle, ''))
    from public.outfit_sets
   where base_set is not null

  union all

  -- 4,693 of 7,087 outfit_variants have a title and every one is distinct,
  -- so pieces are real search targets rather than noise duplicating the set.
  select 'outfit_piece', slug, title, outfit_category, image_url, outfit_set, null::text,
         public.unaccent_fallback(coalesce(title, '') || ' ' || coalesce(outfit_category, ''))
    from public.outfit_variants
   where title is not null and btrim(title) <> ''

  union all

  select 'eureka_set', slug, title, style, null::text, null::text, null::text,
         public.unaccent_fallback(
           coalesce(title, '') || ' ' || coalesce(style, '') || ' ' || coalesce(label, '')
         )
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
         public.unaccent_fallback(
           coalesce(s.title, '') || ' ' || coalesce(v.category, '') || ' ' || coalesce(v.color, '')
         )
    from public.eureka_variants v
    join public.eureka_sets s on s.slug = v.eureka_set

  union all

  select 'makeup_set', slug, title, style, image_url, null::text, null::text,
         public.unaccent_fallback(coalesce(title, '') || ' ' || coalesce(style, ''))
    from public.makeup_sets

  union all

  select 'makeup_variant', slug, title, makeup_category, image_url, makeup_set, null::text,
         public.unaccent_fallback(coalesce(title, '') || ' ' || coalesce(makeup_category, ''))
    from public.makeup_variants
   where title is not null and btrim(title) <> ''

  union all

  select 'momo_cloak', slug, title, style, image_url, null::text, null::text,
         public.unaccent_fallback(coalesce(title, '') || ' ' || coalesce(style, ''))
    from public.momo_cloaks

  union all

  select 'season', slug, title, location, image_url, null::text, null::text,
         public.unaccent_fallback(coalesce(title, '') || ' ' || coalesce(location, ''))
    from public.seasons

  union all

  select 'trial', slug, title, realm, image_url, null::text, null::text,
         public.unaccent_fallback(coalesce(title, '') || ' ' || coalesce(realm, ''))
    from public.trials

  union all

  -- custom_looks uses `name`, not `title`.
  select 'custom_look', slug, name, null::text, image_url, null::text, null::text,
         public.unaccent_fallback(coalesce(name, ''))
    from public.custom_looks

  union all

  -- profiles has no slug; username IS the /u/[username] path segment.
  select 'profile', username, coalesce(display_name, username), null::text, avatar_url, null::text, null::text,
         public.unaccent_fallback(coalesce(display_name, '') || ' ' || coalesce(username, ''))
    from public.profiles;

-- Two passes in one round-trip.
--
-- The fuzzy pass runs ONLY when the strict pass is thin. This is the core
-- behavioral rule: a query with good exact matches never shows mystery
-- results, while a typo still gets rescued. Both constants are calibration
-- knobs expected to need tuning against real queries.
--
-- SECURITY INVOKER (the default, stated explicitly) is what makes RLS apply:
-- custom_looks and profiles rows are filtered to what the caller may see,
-- with no filtering logic in this function at all.
-- Two passes in one statement.
--
-- The fuzzy pass runs ONLY when the strict pass is thin. This is the core
-- behavioral rule: a query with good exact matches never shows mystery
-- results, while a typo still gets rescued.
--
-- Written as CTEs rather than a temp table: `create temp table` is DDL, which
-- a STABLE function is not permitted to execute at call time (it would raise
-- at runtime, not at CREATE FUNCTION time). CTEs also let the planner see the
-- whole query at once.
--
-- Every function is schema-qualified, including public.similarity() -- under
-- `search_path = ''` the bare name does not resolve, and pg_trgm is installed
-- into the public schema on this project.
--
-- SECURITY INVOKER is what makes RLS apply: custom_looks and profiles rows are
-- filtered to what the caller may see, and obtained_* is read as the caller, so
-- one user can never see another's collection state.
create or replace function public.search_all(q text)
returns table (
  kind text,
  slug text,
  title text,
  subtitle text,
  image_url text,
  parent_slug text,
  filter_value text,
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
    select s.kind, s.slug, s.title, s.subtitle, s.image_url, s.parent_slug, s.filter_value,
           -- A match at position 1 outranks one mid-string, so a prefix hit
           -- sorts above an incidental substring.
           (1.0 / position(f.term in lower(s.haystack)))::real as rank
      from public.search_index s, folded f
     where f.term <> ''
       and lower(s.haystack) like '%' || f.term || '%'
  ),
  fuzzy_hits as (
    select s.kind, s.slug, s.title, s.subtitle, s.image_url, s.parent_slug, s.filter_value,
           public.similarity(s.haystack, f.term) as rank
      from public.search_index s, folded f
     where f.term <> ''
       -- Rescue pass only: skipped entirely when the strict pass was rich
       -- enough, so a good query never shows weak similarity matches.
       and (select count(*) from strict_hits) < 5
       and public.similarity(s.haystack, f.term) > 0.3
       and not exists (
         select 1 from strict_hits h where h.kind = s.kind and h.slug = s.slug
       )
  ),
  combined as (
    select * from strict_hits
    union all
    select * from fuzzy_hits
  )
  select c.kind, c.slug, c.title, c.subtitle, c.image_url, c.parent_slug, c.filter_value,
         -- Obtained state for the rows on screen only -- keyed per domain by
         -- the same natural keys the toggle_obtained_* RPCs take. Null for
         -- kinds that are not collectible (seasons, profiles, trials, ...)
         -- and null for everyone signed out, since RLS returns no rows.
         case c.kind
           when 'outfit_piece' then exists (
             select 1 from public.obtained_outfit o
              where o.outfit_set = c.parent_slug and o.outfit_variant = c.slug
           )
           when 'eureka_variant' then exists (
             select 1 from public.obtained_eureka o
              where o.eureka_set = c.parent_slug and o.color = c.filter_value
           )
           when 'makeup_variant' then exists (
             select 1 from public.obtained_makeup o
              where o.makeup_set = c.parent_slug and o.makeup_variant = c.slug
           )
           when 'momo_cloak' then exists (
             select 1 from public.obtained_momo_cloaks o where o.momo_cloak = c.slug
           )
           else null
         end as obtained,
         c.rank
    from combined c
   order by c.rank desc, c.title asc
   limit 100;
$function$;

grant execute on function public.search_all(text) to anon, authenticated;

-- GIN over gin_trgm_ops serves BOTH ILIKE and similarity(), so one index per
-- title expression covers the strict and fuzzy passes alike. Indexed on the
-- unaccent_fallback() expression because that is exactly what the view's
-- haystack computes -- an index on the raw column would not be used.
create index if not exists outfit_sets_search_trgm
  on public.outfit_sets using gin (public.unaccent_fallback(title) gin_trgm_ops);
create index if not exists outfit_variants_search_trgm
  on public.outfit_variants using gin (public.unaccent_fallback(title) gin_trgm_ops);
create index if not exists eureka_sets_search_trgm
  on public.eureka_sets using gin (public.unaccent_fallback(title) gin_trgm_ops);
create index if not exists makeup_sets_search_trgm
  on public.makeup_sets using gin (public.unaccent_fallback(title) gin_trgm_ops);
create index if not exists makeup_variants_search_trgm
  on public.makeup_variants using gin (public.unaccent_fallback(title) gin_trgm_ops);
create index if not exists momo_cloaks_search_trgm
  on public.momo_cloaks using gin (public.unaccent_fallback(title) gin_trgm_ops);
