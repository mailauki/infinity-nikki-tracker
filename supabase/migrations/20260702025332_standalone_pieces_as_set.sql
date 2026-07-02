-- Make standalone outfit pieces (outfit_set IS NULL) a first-class set and
-- re-key obtained_outfit on the variant slug so same-category pieces (all the
-- standalone pieces are `hair`) are individually trackable.

-- 1. Create the standalone-pieces set. Placeholder rarity 2 (CHECK 2..5);
--    set-level rarity is cosmetic — variants carry their own.
insert into public.outfit_sets (slug, title, rarity, "order", base_set, handheld_base_only)
values ('standalone-pieces', 'Standalone Pieces', 2, 1, null, false)
on conflict (slug) do nothing;

-- 2. Re-point standalone variants onto the new set.
update public.outfit_variants
set outfit_set = 'standalone-pieces'
where outfit_set is null;

-- 3. Add the variant-slug obtained key. First FK from obtained_outfit to
--    outfit_variants — deleting a variant now cascades to its obtained rows.
alter table public.obtained_outfit
  add column outfit_variant text;

alter table public.obtained_outfit
  add constraint obtained_outfit_variant_fkey
    foreign key (outfit_variant) references public.outfit_variants (slug)
    on update cascade on delete cascade;

-- 4. Delete orphan obtained rows (point to removed variants) so outfit_variant
--    can be NOT NULL. These are untoggleable dead records.
delete from public.obtained_outfit o
where not exists (
  select 1 from public.outfit_variants v
  where v.outfit_set = o.outfit_set
    and v.outfit_category = o.outfit_category
);

-- 5. Backfill outfit_variant for every remaining row from the unique
--    (outfit_set, outfit_category) mapping.
update public.obtained_outfit o
set outfit_variant = v.slug
from public.outfit_variants v
where v.outfit_set = o.outfit_set
  and v.outfit_category = o.outfit_category;

-- 6. Enforce NOT NULL now that every row has a variant.
alter table public.obtained_outfit
  alter column outfit_variant set not null;

-- 7. Variant slug is the unique identity per user.
alter table public.obtained_outfit
  drop constraint obtained_outfit_unique;
alter table public.obtained_outfit
  add constraint obtained_outfit_unique unique (user_id, outfit_variant);

create index if not exists obtained_outfit_variant_idx
  on public.obtained_outfit (outfit_variant);

-- 8. Toggle keyed on the variant slug. Insert still writes all three columns so
--    the kept FK columns stay populated.
drop function if exists public.toggle_obtained_outfit(text, text);
create or replace function public.toggle_obtained_outfit(
  p_outfit_set      text,
  p_outfit_category text,
  p_outfit_variant  text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.obtained_outfit
  where user_id        = (select auth.uid())
    and outfit_variant = p_outfit_variant;
  if not found then
    insert into public.obtained_outfit (user_id, outfit_set, outfit_category, outfit_variant)
    values ((select auth.uid()), p_outfit_set, p_outfit_category, p_outfit_variant);
  end if;
end;
$$;
grant execute on function public.toggle_obtained_outfit(text, text, text)
  to authenticated, anon, service_role;
