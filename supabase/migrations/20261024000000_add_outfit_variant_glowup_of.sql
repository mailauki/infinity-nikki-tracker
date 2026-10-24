-- outfit_variants.glowup_of: a glow-up piece points at its base piece.
--
-- Standalone 4★/5★ pieces have no set to hang a glow-up on, so the admin sets
-- their link by hand. Set pieces are DERIVED: a piece in a glow-up set (order 0)
-- links to the piece of the same category in that glow-up's base set. Triggers
-- own the derivation so every writer (set forms, variant form, DataGrid,
-- glow-up order flips) stays in sync without app code.
--
-- ON UPDATE CASCADE: a recategorize rewrites the base piece's slug, and the
-- link must follow it. ON DELETE SET NULL: deleting the base leaves the
-- glow-up as an ordinary piece rather than deleting it.

alter table public.outfit_variants
  add column glowup_of text
    references public.outfit_variants (slug) on update cascade on delete set null,
  add constraint outfit_variants_glowup_of_not_self check (glowup_of <> slug);

create index outfit_variants_glowup_of_idx on public.outfit_variants (glowup_of);

-- Base piece for a piece in `p_set`, or null when `p_set` is not a glow-up set.
create or replace function public.derive_outfit_variant_glowup_of(p_set text, p_category text)
returns text
language sql
stable
set search_path = ''
as $$
  select b.slug
  from public.outfit_sets g
  join public.outfit_variants b
    on b.outfit_set = g.base_set and b.outfit_category = p_category
  where g.slug = p_set and g."order" = 0
  limit 1;
$$;

-- Re-derive the link for every piece in the evolutions of base set `p_base`.
-- Writes only rows that actually change, so updated_at doesn't churn.
create or replace function public.refresh_outfit_glowup_of(p_base text)
returns void
language sql
set search_path = ''
as $$
  update public.outfit_variants v
  set glowup_of = public.derive_outfit_variant_glowup_of(v.outfit_set, v.outfit_category)
  from public.outfit_sets s
  where s.slug = v.outfit_set
    and s.base_set = p_base
    and v.glowup_of is distinct from
      public.derive_outfit_variant_glowup_of(v.outfit_set, v.outfit_category);
$$;

-- A set piece's own write: derive its link. Standalone links are hand-set.
create or replace function public.set_outfit_variant_glowup_of()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.outfit_set is not null and new.outfit_set <> 'standalone_pieces' then
    new.glowup_of := public.derive_outfit_variant_glowup_of(new.outfit_set, new.outfit_category);
  end if;
  return new;
end;
$$;

create trigger trg_set_outfit_variant_glowup_of
  before insert or update of outfit_set, outfit_category, glowup_of on public.outfit_variants
  for each row execute function public.set_outfit_variant_glowup_of();

-- A base piece added, moved, recategorized or deleted: its glow-up pieces re-derive.
create or replace function public.refresh_glowup_of_from_variant()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op <> 'INSERT' then
    perform public.refresh_outfit_glowup_of(old.outfit_set);
  end if;
  if tg_op <> 'DELETE' and new.outfit_set is distinct from old.outfit_set then
    perform public.refresh_outfit_glowup_of(new.outfit_set);
  end if;
  return null;
end;
$$;

create trigger trg_refresh_glowup_of_from_variant
  after insert or delete or update of outfit_set, outfit_category on public.outfit_variants
  for each row execute function public.refresh_glowup_of_from_variant();

-- An evolution made or unmade the glow-up (order 0), or moved between bases.
-- Negative orders are the set-edit action's transient "park" step before it
-- writes final orders; skip them, or every save would null then restore the
-- glow-up links (and bump their updated_at) for nothing.
create or replace function public.refresh_glowup_of_from_set()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new."order" < 0 then
    return null;
  end if;
  if new.base_set is not null then
    perform public.refresh_outfit_glowup_of(new.base_set);
  end if;
  if tg_op = 'UPDATE' and old.base_set is distinct from new.base_set and old.base_set is not null then
    perform public.refresh_outfit_glowup_of(old.base_set);
  end if;
  return null;
end;
$$;

create trigger trg_refresh_glowup_of_from_set
  after insert or update of "order", base_set on public.outfit_sets
  for each row execute function public.refresh_glowup_of_from_set();

-- Backfill existing set glow-up pieces without bumping their updated_at.
alter table public.outfit_variants disable trigger trg_set_updated_at;
select public.refresh_outfit_glowup_of(slug) from public.outfit_sets where base_set is null;
alter table public.outfit_variants enable trigger trg_set_updated_at;
