-- supabase/migrations/20260603000001_evolutions_per_outfit_set.sql
-- Bind evolutions to a single outfit set (title = set title, subtitle = per-evo label)
--
-- NOTE: outfit_set column and FK already exist on the remote DB (added manually).
-- This migration completes the remaining changes.

-- 1. Finish evolutions table changes -----------------------------------------

-- Back-fill outfit_set from existing variant references (in case any rows are missing)
update public.evolutions e
set outfit_set = (
  select v.outfit_set
  from public.outfit_variants v
  where v.evolution = e.slug
  limit 1
)
where e.outfit_set is null;

-- Remove orphaned evolutions (no variant reference) before setting NOT NULL
delete from public.evolutions
where outfit_set is null;

-- Set NOT NULL on outfit_set
alter table public.evolutions
  alter column outfit_set set not null;

-- Drop global title uniqueness; replace with per-set subtitle + order uniqueness
alter table public.evolutions
  drop constraint evolutions_title_key;

alter table public.evolutions
  add constraint evolutions_outfit_set_subtitle_key unique (outfit_set, subtitle);

alter table public.evolutions
  add constraint evolutions_outfit_set_order_key unique (outfit_set, "order");

create index if not exists evolutions_outfit_set_idx on public.evolutions (outfit_set);


-- 2. Make obtained_outfit.evolution nullable ----------------------------------
alter table public.obtained_outfit
  alter column evolution drop not null;

-- Replace the single unique constraint with two partial indexes.
-- A standard UNIQUE constraint treats two NULLs as distinct, allowing duplicate
-- no-evolution rows. Partial indexes enforce the correct semantic.
alter table public.obtained_outfit
  drop constraint obtained_outfit_unique;

create unique index obtained_outfit_unique_with_evo
  on public.obtained_outfit (user_id, outfit_set, outfit_category, evolution)
  where evolution is not null;

create unique index obtained_outfit_unique_no_evo
  on public.obtained_outfit (user_id, outfit_set, outfit_category)
  where evolution is null;


-- 3. Update obtained_outfit evolution FK: SET NULL on delete ------------------
-- Preserves user progress rows when an evolution is removed.
alter table public.obtained_outfit
  drop constraint obtained_outfit_evolution_fkey;

alter table public.obtained_outfit
  add constraint obtained_outfit_evolution_fkey
    foreign key (evolution)
    references public.evolutions (slug)
    on update cascade
    on delete set null;


-- 4. Update toggle function to handle nullable evolution ----------------------
create or replace function public.toggle_obtained_outfit(
  p_outfit_set      text,
  p_outfit_category text,
  p_evolution       text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_evolution is not null then
    delete from public.obtained_outfit
    where user_id         = (select auth.uid())
      and outfit_set      = p_outfit_set
      and outfit_category = p_outfit_category
      and evolution       = p_evolution;
  else
    delete from public.obtained_outfit
    where user_id         = (select auth.uid())
      and outfit_set      = p_outfit_set
      and outfit_category = p_outfit_category
      and evolution is null;
  end if;

  if not found then
    insert into public.obtained_outfit (user_id, outfit_set, outfit_category, evolution)
    values ((select auth.uid()), p_outfit_set, p_outfit_category, p_evolution);
  end if;
end;
$$;

grant execute on function public.toggle_obtained_outfit(text, text, text)
  to authenticated, anon, service_role;
