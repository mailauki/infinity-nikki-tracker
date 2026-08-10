-- Add `alt_slug` to outfit_variants and makeup_variants.
--
-- WHY
-- A variant's `slug` is derived two different ways depending on ownership
-- (see app/admin/{outfits,makeup}/variants/fields.tsx):
--
--   set-owned  -> {set}-{category}          e.g. 'moonlit_dress-hair'
--   standalone -> {toSlug(title)}-{category} e.g. 'silverplume-hair'
--
-- So the SAME physical piece has two different slugs depending on whether it
-- was authored inside a set or as a loose piece. Nothing today can tell that
-- 'moonlit_dress-hair' (titled "Silverplume") and a new standalone
-- 'silverplume-hair' are the same item, so a piece that already ships inside a
-- set can be re-added as a standalone duplicate.
--
-- `alt_slug` closes that gap: for a set-owned variant it stores the slug that
-- variant WOULD have had as a standalone piece. Adding a standalone piece can
-- then look up alt_slug and find the set that already contains it.
--
-- `slug` IS NOT TOUCHED. Image storage paths are `{table}/{slug}`
-- (components/forms/image-upload.tsx), so rewriting slug would 404 every image.
-- alt_slug is a pure lookup key and is never used to build a storage path.
--
-- NULLABILITY
-- alt_slug is nullable on purpose, and is only populated for set-owned rows
-- that have a title:
--   * Standalone rows are left NULL — their `slug` is ALREADY the title-derived
--     form, so an alt_slug would duplicate it and fight the unique index below.
--   * 2597 outfit + 10 makeup set-owned rows have no title and cannot derive
--     one. They stay NULL until a title is authored, at which point the trigger
--     fills them in.
--
-- UNIQUENESS
-- Partial UNIQUE indexes (WHERE alt_slug IS NOT NULL) let the many NULL rows
-- coexist while still rejecting two set-owned variants claiming the same
-- identity. Verified against production data before writing this migration:
-- zero internal duplicates and zero collisions with existing standalone slugs.

alter table public.outfit_variants add column if not exists alt_slug text;
alter table public.makeup_variants add column if not exists alt_slug text;

comment on column public.outfit_variants.alt_slug is
  'Title-derived slug ({toSlug(title)}-{category}) for set-owned variants: the slug this piece would have as a standalone. Used to detect a standalone re-add of a piece that already belongs to a set. NULL for standalone rows (their slug is already this form) and for rows with no title. Never used as an image storage path.';
comment on column public.makeup_variants.alt_slug is
  'Title-derived slug ({toSlug(title)}-{category}) for set-owned variants: the slug this piece would have as a standalone. Used to detect a standalone re-add of a piece that already belongs to a set. NULL for standalone rows (their slug is already this form) and for rows with no title. Never used as an image storage path.';

-- toSlug() normalizes NFD and strips combining marks. The `unaccent` extension
-- is not guaranteed here, so fold the accented latin-1 letters that actually
-- occur in item names rather than depending on it.
create or replace function public.unaccent_fallback(t text)
returns text
language sql
immutable
set search_path = ''
as $$
  select translate(
    coalesce(t, ''),
    'àáâãäåèéêëìíîïòóôõöùúûüýÿñçÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝÑÇ',
    'aaaaaaeeeeiiiiooooouuuuyyncAAAAAAEEEEIIIIOOOOOUUUUYNC'
  );
$$;

-- Mirrors toSlug() in lib/utils.ts. Step order is load-bearing and must match:
--   1. strip apostrophes BEFORE the allowlist so "Dawn's" -> 'dawns', not 'dawn_s'
--   2. '&' -> ' and ' with SPACES, so the allowlist (which forbids '_') cannot
--      strip the separator back out ("Growth & Decay" -> 'growth_and_decay')
--   3. only then drop remaining punctuation and collapse whitespace/hyphens
--   4. trim leading/trailing separators ("Trailing-" -> 'trailing')
create or replace function public.variant_to_slug(name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              lower(public.unaccent_fallback(btrim(coalesce(name, '')))),
              '[''' || chr(8216) || chr(8217) || ']', '', 'g'),
            '\s*&\s*', ' and ', 'g'),
          '[^a-z0-9 -]', ' ', 'g'),
        '[\s-]+', '_', 'g'),
      '^_+|_+$', '', 'g'),
    '');
$$;

-- Derive alt_slug for a set-owned, titled variant; NULL in every other case.
create or replace function public.derive_outfit_variant_alt_slug(
  p_outfit_set text, p_outfit_category text, p_title text
) returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_outfit_set is null or p_outfit_set = 'standalone_pieces' then null
    when public.variant_to_slug(p_title) is null then null
    else public.variant_to_slug(p_title) || '-' || coalesce(p_outfit_category, '')
  end;
$$;

create or replace function public.derive_makeup_variant_alt_slug(
  p_makeup_set text, p_makeup_category text, p_title text
) returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_makeup_set is null or p_makeup_set = 'standalone_pieces' then null
    when public.variant_to_slug(p_title) is null then null
    else public.variant_to_slug(p_title) || '-' || coalesce(p_makeup_category, '')
  end;
$$;

-- Backfill.
update public.outfit_variants
set alt_slug = public.derive_outfit_variant_alt_slug(outfit_set, outfit_category, title)
where alt_slug is distinct from
      public.derive_outfit_variant_alt_slug(outfit_set, outfit_category, title);

update public.makeup_variants
set alt_slug = public.derive_makeup_variant_alt_slug(makeup_set, makeup_category, title)
where alt_slug is distinct from
      public.derive_makeup_variant_alt_slug(makeup_set, makeup_category, title);

-- Keep alt_slug in lockstep with its sources. Without this, renaming a variant
-- or moving it between sets would strand a stale alt_slug and the duplicate
-- check would silently consult the wrong key.
create or replace function public.set_outfit_variant_alt_slug()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.alt_slug := public.derive_outfit_variant_alt_slug(
    new.outfit_set, new.outfit_category, new.title);
  return new;
end;
$$;

create or replace function public.set_makeup_variant_alt_slug()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.alt_slug := public.derive_makeup_variant_alt_slug(
    new.makeup_set, new.makeup_category, new.title);
  return new;
end;
$$;

drop trigger if exists trg_set_outfit_variant_alt_slug on public.outfit_variants;
create trigger trg_set_outfit_variant_alt_slug
  before insert or update of outfit_set, outfit_category, title
  on public.outfit_variants
  for each row execute function public.set_outfit_variant_alt_slug();

drop trigger if exists trg_set_makeup_variant_alt_slug on public.makeup_variants;
create trigger trg_set_makeup_variant_alt_slug
  before insert or update of makeup_set, makeup_category, title
  on public.makeup_variants
  for each row execute function public.set_makeup_variant_alt_slug();

-- Partial unique indexes: enforce identity only where alt_slug is populated.
-- These double as the lookup path for the duplicate check when adding a
-- standalone piece (given a candidate title-derived slug, find the set variant
-- already holding it), so no separate non-unique index is needed.
create unique index if not exists outfit_variants_alt_slug_key
  on public.outfit_variants (alt_slug) where alt_slug is not null;

create unique index if not exists makeup_variants_alt_slug_key
  on public.makeup_variants (alt_slug) where alt_slug is not null;
