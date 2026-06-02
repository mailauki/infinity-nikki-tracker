-- supabase/migrations/20260601000007_add_obtained_outfit.sql

create table public.obtained_outfit (
  id               bigserial    not null,
  user_id          uuid         not null,
  outfit_set       text         not null,
  outfit_category  text         not null,
  evolution        text         not null,
  created_at       timestamptz  not null default now(),
  constraint obtained_outfit_pkey primary key (id),
  constraint obtained_outfit_unique unique (user_id, outfit_set, outfit_category, evolution),
  constraint obtained_outfit_user_fkey foreign key (user_id)
    references auth.users (id) on delete cascade,
  constraint obtained_outfit_set_fkey foreign key (outfit_set)
    references public.outfit_sets (slug) on update cascade,
  constraint obtained_outfit_category_fkey foreign key (outfit_category)
    references public.outfit_categories (slug) on update cascade,
  constraint obtained_outfit_evolution_fkey foreign key (evolution)
    references public.evolutions (slug) on update cascade
);

alter table public.obtained_outfit replica identity full;

alter table public.obtained_outfit enable row level security;
alter table public.obtained_outfit force row level security;

create policy obtained_outfit_user_policy on public.obtained_outfit
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index obtained_outfit_user_idx on public.obtained_outfit (user_id);
create index obtained_outfit_set_idx on public.obtained_outfit (outfit_set);
create index obtained_outfit_category_idx on public.obtained_outfit (outfit_category);
create index obtained_outfit_evolution_idx on public.obtained_outfit (evolution);

-- Atomic toggle: deletes if exists, inserts if not.
create or replace function public.toggle_obtained_outfit(
  p_outfit_set       text,
  p_outfit_category  text,
  p_evolution        text
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
    and outfit_category = p_outfit_category
    and evolution       = p_evolution;

  if not found then
    insert into public.obtained_outfit (user_id, outfit_set, outfit_category, evolution)
    values ((select auth.uid()), p_outfit_set, p_outfit_category, p_evolution);
  end if;
end;
$$;
