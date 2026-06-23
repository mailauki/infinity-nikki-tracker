-- 20260622000001_merge_evolutions_into_outfit_sets.sql
-- Merge evolutions into outfit_sets: every row is an outfit state.
-- base = base_set IS NULL (order 1); glow-up = order 0; evolution = order >= 2.

begin;

-- 1. New columns on outfit_sets.
alter table public.outfit_sets add column if not exists "order" int;
alter table public.outfit_sets add column if not exists base_set text;
update public.outfit_sets set "order" = 1 where "order" is null;

-- 1b. Drop global title uniqueness. Evolution subtitles repeat across sets
--     (e.g. "New Bud"), so folding evolutions into outfit_sets makes title
--     non-unique by design. Identity stays on slug (still unique). This mirrors
--     20260603000001, which already dropped the same constraint on evolutions.
alter table public.outfit_sets drop constraint if exists outfit_sets_title_key;

-- 2. Copy non-base evolution rows into outfit_sets, inheriting set-level fields
--    from the matching base set. Evolution order values carry over unchanged.
insert into public.outfit_sets (
  slug, title, "order", base_set,
  description, rarity, style, label, label_2, ability, seasons, season_category,
  image_url, alt_image_url, created_at, updated_at
)
select
  e.slug,
  e.subtitle,
  e."order",
  e.outfit_set,                       -- base set's clean slug
  e.description,
  s.rarity, s.style, s.label, s.label_2, s.ability, s.seasons, s.season_category,
  e.image_url, e.alt_image_url, e.created_at, e.updated_at
from public.evolutions e
join public.outfit_sets s on s.slug = e.outfit_set
where e.subtitle is distinct from 'base';

-- 3+4. Collapse outfit_variants onto the state slug. Every variant's `evolution`
--    holds its canonical state slug: base = '{set}-base', evolution = '{set}-{sub}'
--    (evolution is never null in this data). Set outfit_set = that state slug,
--    BUT base rows must land on the clean '{set}' slug (base rows keep clean
--    slugs), so strip the '-base' suffix in the same statement — doing it in two
--    passes would briefly violate the outfit_set FK with a '{set}-base' value.
update public.outfit_variants v
set outfit_set = case
  when v.evolution like '%-base'
    then left(v.evolution, length(v.evolution) - length('-base'))
  else v.evolution
end;

-- The base-variant-default trigger fires on `update of evolution`, so it has a
-- column dependency on outfit_variants.evolution. Drop it before dropping the
-- column; it is recreated (order-based) in step 8.
drop trigger if exists trg_enforce_base_variant_default on public.outfit_variants;

alter table public.outfit_variants drop column evolution;

-- 5. Collapse obtained_outfit the same way. Base obtained rows store
--    evolution = '{set}-base' (NOT null in this data); evolution rows store
--    '{set}-{sub}'. Set outfit_set to the state slug, stripping '-base' for base.
update public.obtained_outfit o
set outfit_set = case
  when o.evolution like '%-base'
    then left(o.evolution, length(o.evolution) - length('-base'))
  else o.evolution
end;

drop index if exists public.obtained_outfit_unique_with_evo;
drop index if exists public.obtained_outfit_unique_no_evo;
alter table public.obtained_outfit drop column evolution;
alter table public.obtained_outfit
  add constraint obtained_outfit_unique unique (user_id, outfit_set, outfit_category);

-- 6. Merge carousel rows into outfit_set_carousel_images, then drop the evo table.
insert into public.outfit_set_carousel_images (outfit_set, image_url, sort_order, created_at)
select eci.evolution, eci.image_url, eci.sort_order, eci.created_at
from public.evolution_carousel_images eci;

drop table public.evolution_carousel_images;

-- 7. Glow-up remap: the evolution a set's glowup_evolution pointed at gets order 0.
update public.outfit_sets ev
set "order" = 0
from public.outfit_sets base
where base.glowup_evolution = ev.slug;

alter table public.outfit_sets drop column glowup_evolution;

-- 8. Constraints + triggers.
alter table public.outfit_sets
  add constraint outfit_sets_base_set_fkey
    foreign key (base_set) references public.outfit_sets (slug) on update cascade;
create unique index outfit_sets_base_set_order_key
  on public.outfit_sets (base_set, "order") where base_set is not null;
alter table public.outfit_sets alter column "order" set not null;

-- Order-based base-variant default: default = (owning row has order 1).
create or replace function public.enforce_base_variant_default()
returns trigger
language plpgsql
as $$
begin
  new."default" := (
    select s."order" = 1 from public.outfit_sets s where s.slug = new.outfit_set
  );
  return new;
end;
$$;

-- Recreate the trigger (dropped in step 4). It now keys off outfit_set — the
-- variant's owning state row — instead of the removed evolution column.
create trigger trg_enforce_base_variant_default
  before insert or update of outfit_set, "default"
  on public.outfit_variants
  for each row
  execute function public.enforce_base_variant_default();

-- Toggle RPC: drop p_evolution.
drop function if exists public.toggle_obtained_outfit(text, text, text);
create or replace function public.toggle_obtained_outfit(
  p_outfit_set      text,
  p_outfit_category text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.obtained_outfit
  where user_id         = (select auth.uid())
    and outfit_set      = p_outfit_set
    and outfit_category = p_outfit_category;
  if not found then
    insert into public.obtained_outfit (user_id, outfit_set, outfit_category)
    values ((select auth.uid()), p_outfit_set, p_outfit_category);
  end if;
end;
$$;
grant execute on function public.toggle_obtained_outfit(text, text)
  to authenticated, anon, service_role;

-- 9. Drop evolutions (now unreferenced).
drop table public.evolutions;

commit;
