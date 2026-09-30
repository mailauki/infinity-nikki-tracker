-- Release date + version for every collectable.
--
-- seasons and trials are the SOURCES: most rows inherit from their season, and
-- a eureka set inherits from the earliest trial it drops from. Every other
-- table's pair is an optional OVERRIDE for a mid-season release or a rerun.
-- Nothing is materialized; hooks/release.ts resolves the chain at read time,
-- so editing a season's date moves everything beneath it.
alter table public.seasons
  add column if not exists released_at date,
  add column if not exists version text;
alter table public.trials
  add column if not exists released_at date,
  add column if not exists version text;
alter table public.outfit_sets
  add column if not exists released_at date,
  add column if not exists version text;
alter table public.outfit_variants
  add column if not exists released_at date,
  add column if not exists version text;
alter table public.makeup_sets
  add column if not exists released_at date,
  add column if not exists version text;
alter table public.makeup_variants
  add column if not exists released_at date,
  add column if not exists version text;
alter table public.eureka_sets
  add column if not exists released_at date,
  add column if not exists version text;
alter table public.momo_cloaks
  add column if not exists released_at date,
  add column if not exists version text;

-- Which season page lists a eureka set (under the eureka_collection category).
alter table public.eureka_sets
  add column if not exists seasons text
    references public.seasons (slug) on update cascade on delete set null;
create index if not exists eureka_sets_seasons_idx on public.eureka_sets (seasons);

alter table public.user_preferences
  add column if not exists season_hide_eureka boolean not null default false,
  add column if not exists season_hide_cloaks boolean not null default false;

-- Backfill: a set's region is the location of the EARLIEST trial it drops from
-- (by trial id — trials have no dates yet), so the ten sets shared between
-- Wishfield and Itzaland trials resolve to Wishfield. Each region's first
-- season is where its eureka sets are listed.
with first_trial as (
  select distinct on (st.eureka_set) st.eureka_set, t.location
  from public.eureka_set_trials st
  join public.trials t on t.slug = st.trial
  order by st.eureka_set, t.id
)
update public.eureka_sets s
set seasons = case ft.location
  when 'wishfield' then 'exploration_season'
  when 'itzaland' then 'terras_call'
end
from first_trial ft
where ft.eureka_set = s.slug
  and s.seasons is null;

-- Not obtained from any trial, so placed by hand.
update public.eureka_sets set seasons = 'exploration_season'
  where slug = 'moon_laurel_rabbit' and seasons is null;
update public.eureka_sets set seasons = 'terras_call'
  where slug = 'essence_of_tears' and seasons is null;

-- Guard the known production shape (27 Wishfield / 13 Itzaland). Skipped on any
-- other row count so replaying migrations into an empty preview branch passes.
do $$
declare
  total int;
  wishfield int;
  itzaland int;
begin
  select count(*),
         count(*) filter (where seasons = 'exploration_season'),
         count(*) filter (where seasons = 'terras_call')
    into total, wishfield, itzaland
    from public.eureka_sets;
  if total = 40 and (wishfield <> 27 or itzaland <> 13) then
    raise exception 'eureka season backfill: expected 27/13, got %/%', wishfield, itzaland;
  end if;
end $$;
