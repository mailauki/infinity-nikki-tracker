-- supabase/migrations/20260601000004_add_outfit_tables.sql

-- abilities -----------------------------------------------------------------
create table public.abilities (
  id    bigserial not null,
  slug  text      not null,
  title text      not null,
  constraint abilities_pkey primary key (slug),
  constraint abilities_slug_key unique (slug),
  constraint abilities_title_key unique (title)
);

alter table public.abilities enable row level security;

create policy abilities_read on public.abilities
  for select using (true);

create policy abilities_admin_write on public.abilities
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create index abilities_slug_idx on public.abilities (slug);

-- outfit_categories ---------------------------------------------------------
create table public.outfit_categories (
  id    bigserial not null,
  slug  text      not null,
  title text      not null,
  type  text      not null,
  part  text      not null,
  constraint outfit_categories_pkey primary key (slug),
  constraint outfit_categories_slug_key unique (slug),
  constraint outfit_categories_title_key unique (title)
);

alter table public.outfit_categories enable row level security;

create policy outfit_categories_read on public.outfit_categories
  for select using (true);

create policy outfit_categories_admin_write on public.outfit_categories
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create index outfit_categories_slug_idx on public.outfit_categories (slug);

-- evolutions ----------------------------------------------------------------
create table public.evolutions (
  id          bigserial not null,
  slug        text      not null,
  title       text      not null,
  subtitle    text,
  description text,
  "order"     smallint  not null,
  constraint evolutions_pkey primary key (slug),
  constraint evolutions_slug_key unique (slug),
  constraint evolutions_title_key unique (title),
  constraint evolutions_order_check check ("order" between 1 and 5)
);

alter table public.evolutions enable row level security;

create policy evolutions_read on public.evolutions
  for select using (true);

create policy evolutions_admin_write on public.evolutions
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create index evolutions_slug_idx on public.evolutions (slug);
create index evolutions_order_idx on public.evolutions ("order");

-- outfit_sets ---------------------------------------------------------------
create table public.outfit_sets (
  id          bigserial    not null,
  slug        text         not null,
  title       text         not null,
  description text,
  rarity      bigint       not null,
  style       text,
  label       text,
  ability     text,
  updated_at  timestamptz,
  created_at  timestamptz  default now(),
  constraint outfit_sets_pkey primary key (id, slug),
  constraint outfit_sets_slug_key unique (slug),
  constraint outfit_sets_title_key unique (title),
  constraint outfit_sets_rarity_check check (rarity between 2 and 5),
  constraint outfit_sets_style_fkey foreign key (style)
    references public.styles (slug) on update cascade,
  constraint outfit_sets_label_fkey foreign key (label)
    references public.labels (slug) on update cascade,
  constraint outfit_sets_ability_fkey foreign key (ability)
    references public.abilities (slug) on update cascade
);

alter table public.outfit_sets enable row level security;

create policy outfit_sets_read on public.outfit_sets
  for select using (true);

create policy outfit_sets_admin_write on public.outfit_sets
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create index outfit_sets_slug_idx on public.outfit_sets (slug);
create index outfit_sets_style_idx on public.outfit_sets (style);
create index outfit_sets_label_idx on public.outfit_sets (label);
create index outfit_sets_ability_idx on public.outfit_sets (ability);

-- outfit_variants -----------------------------------------------------------
create table public.outfit_variants (
  id               bigserial not null,
  slug             text      not null,
  outfit_set       text      not null,
  outfit_category  text,
  evolution        text,
  image_url        text,
  "default"        boolean   not null default false,
  updated_at       timestamptz,
  created_at       timestamptz default now(),
  constraint outfit_variants_pkey primary key (id, slug),
  constraint outfit_variants_slug_key unique (slug),
  constraint outfit_variants_outfit_set_fkey foreign key (outfit_set)
    references public.outfit_sets (slug) on update cascade,
  constraint outfit_variants_outfit_category_fkey foreign key (outfit_category)
    references public.outfit_categories (slug) on update cascade,
  constraint outfit_variants_evolution_fkey foreign key (evolution)
    references public.evolutions (slug) on update cascade
);

alter table public.outfit_variants enable row level security;

create policy outfit_variants_read on public.outfit_variants
  for select using (true);

create policy outfit_variants_admin_write on public.outfit_variants
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create index outfit_variants_slug_idx on public.outfit_variants (slug);
create index outfit_variants_outfit_set_idx on public.outfit_variants (outfit_set);
create index outfit_variants_outfit_category_idx on public.outfit_variants (outfit_category);
create index outfit_variants_evolution_idx on public.outfit_variants (evolution);
