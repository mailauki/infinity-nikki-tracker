# Outfit Tables Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `abilities`, `outfit_categories`, `evolutions`, `outfit_sets`, `outfit_variants`, and `obtained_outfit` tables to Supabase, then expose them through TypeScript types and data hooks matching the existing eureka pattern.

**Architecture:** Two SQL migrations create all tables with RLS policies and a toggle function. After regenerating Supabase types, new TypeScript types are added to `lib/types/outfit.ts`. Data hooks in `hooks/data/` and `hooks/data/admin/` mirror the eureka hooks exactly, replacing categories→outfit_categories, colors→evolutions, eureka_set→outfit_set.

**Tech Stack:** Supabase (PostgreSQL, RLS, plpgsql), Next.js App Router, TypeScript, React `cache()`

---

## File Map

| Action     | Path                                                         | Purpose                                                                                        |
| ---------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Create     | `supabase/migrations/20260601000004_add_outfit_tables.sql`   | Tables: abilities, outfit_categories, evolutions, outfit_sets, outfit_variants + RLS + indexes |
| Create     | `supabase/migrations/20260601000005_add_obtained_outfit.sql` | Table: obtained_outfit + RLS + toggle_obtained_outfit()                                        |
| Regenerate | `lib/types/supabase.ts`                                      | Auto-generated Supabase TypeScript types                                                       |
| Create     | `lib/types/outfit.ts`                                        | Domain types for outfit content                                                                |
| Create     | `hooks/data/abilities.ts`                                    | `getAbilities()` lookup hook                                                                   |
| Create     | `hooks/data/outfit-categories.ts`                            | `getOutfitCategories()` lookup hook                                                            |
| Create     | `hooks/data/evolutions.ts`                                   | `getEvolutions()` lookup hook                                                                  |
| Create     | `hooks/data/outfit-sets.ts`                                  | `getOutfitSets()` and `getOutfitSet(slug)` hooks                                               |
| Create     | `hooks/data/obtained-outfit.ts`                              | `getObtainedOutfit(user_id)` hook                                                              |
| Create     | `hooks/data/admin/outfit-sets.ts`                            | `getOutfitSetsRaw()` and `getOutfitSetRaw(slug)`                                               |
| Create     | `hooks/data/admin/outfit-variants.ts`                        | `getOutfitVariantsRaw()` and `getOutfitVariantRaw(slug)`                                       |
| Create     | `hooks/outfit.ts`                                            | `sortOutfitVariants()`, `createOutfitSet()`, `updateOutfitSet()`, `updateOutfitVariants()`     |

---

## Task 1: Migration — core outfit tables

**Files:**

- Create: `supabase/migrations/20260601000004_add_outfit_tables.sql`

- [ ] **Step 1: Create the migration file**

```sql
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
```

- [ ] **Step 2: Push migration to Supabase**

```bash
supabase db push
```

Expected: `Applying migration 20260601000004_add_outfit_tables.sql... done`
If you see FK errors, ensure `styles` and `labels` tables exist (they are created in the initial schema migration).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260601000004_add_outfit_tables.sql
git commit -m "feat: add abilities, outfit_categories, evolutions, outfit_sets, outfit_variants migrations"
```

---

## Task 2: Migration — obtained_outfit table and toggle function

**Files:**

- Create: `supabase/migrations/20260601000005_add_obtained_outfit.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260601000005_add_obtained_outfit.sql

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
```

- [ ] **Step 2: Push migration to Supabase**

```bash
supabase db push
```

Expected: `Applying migration 20260601000005_add_obtained_outfit.sql... done`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260601000005_add_obtained_outfit.sql
git commit -m "feat: add obtained_outfit table and toggle_obtained_outfit function"
```

---

## Task 3: Regenerate Supabase TypeScript types

**Files:**

- Regenerate: `lib/types/supabase.ts`

- [ ] **Step 1: Regenerate types**

```bash
supabase gen types typescript --project-id ykfuevyqpjvtxidjnhxm > lib/types/supabase.ts
```

Expected: No errors. The file `lib/types/supabase.ts` is overwritten with updated types that include `abilities`, `evolutions`, `outfit_categories`, `outfit_sets`, `outfit_variants`, `obtained_outfit`.

- [ ] **Step 2: Verify new tables appear in the generated file**

```bash
grep -E "abilities|evolutions|outfit_categories|outfit_sets|outfit_variants|obtained_outfit" lib/types/supabase.ts | head -20
```

Expected: Lines showing each table name in the `Database` type definition.

- [ ] **Step 3: Commit**

```bash
git add lib/types/supabase.ts
git commit -m "chore: regenerate supabase types for outfit tables"
```

---

## Task 4: TypeScript domain types

**Files:**

- Create: `lib/types/outfit.ts`

- [ ] **Step 1: Create the types file**

```typescript
// lib/types/outfit.ts
import { Tables } from './supabase'

export type Ability = Pick<Tables<'abilities'>, 'slug' | 'title'>

export type OutfitCategory = Pick<Tables<'outfit_categories'>, 'slug' | 'title' | 'type' | 'part'>

export type Evolution = Pick<
  Tables<'evolutions'>,
  'slug' | 'title' | 'subtitle' | 'description' | 'order'
>

export type OutfitSet = Tables<'outfit_sets'> & {
  image_url: string | null | undefined
  outfit_variants: OutfitVariant[]
  outfit_categories: OutfitCategory[]
  evolutions: Evolution[]
}

export type OutfitSetRaw = Pick<
  Tables<'outfit_sets'>,
  'id' | 'slug' | 'title' | 'description' | 'rarity' | 'style' | 'label' | 'ability' | 'updated_at'
>

export type OutfitVariant = Pick<
  Tables<'outfit_variants'>,
  'id' | 'slug' | 'outfit_set' | 'evolution' | 'outfit_category' | 'image_url' | 'default'
> & { obtained?: boolean }

export type OutfitVariantRaw = Pick<
  Tables<'outfit_variants'>,
  | 'id'
  | 'slug'
  | 'outfit_set'
  | 'evolution'
  | 'outfit_category'
  | 'image_url'
  | 'default'
  | 'updated_at'
> & {
  outfit_sets: { title: string } | null
  outfit_categories: { title: string } | null
  evolutions: { title: string | null } | null
}

export type ObtainedOutfit = Pick<
  Tables<'obtained_outfit'>,
  'id' | 'outfit_set' | 'outfit_category' | 'evolution'
>
```

- [ ] **Step 2: Type-check**

```bash
yarn tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add lib/types/outfit.ts
git commit -m "feat: add TypeScript domain types for outfit tables"
```

---

## Task 5: Lookup data hooks (abilities, outfit_categories, evolutions)

**Files:**

- Create: `hooks/data/abilities.ts`
- Create: `hooks/data/outfit-categories.ts`
- Create: `hooks/data/evolutions.ts`

- [ ] **Step 1: Create abilities hook**

```typescript
// hooks/data/abilities.ts
import { cache } from 'react'
import { Ability } from '@/lib/types/outfit'
import { createClient } from '@/lib/supabase/server'

export const getAbilities = cache(async () => {
  const supabase = await createClient()

  const { data: abilities } = await supabase
    .from('abilities')
    .select('slug, title')
    .order('title', { ascending: true })

  return (abilities ?? []) as Ability[]
})
```

- [ ] **Step 2: Create outfit_categories hook**

```typescript
// hooks/data/outfit-categories.ts
import { cache } from 'react'
import { OutfitCategory } from '@/lib/types/outfit'
import { createClient } from '@/lib/supabase/server'

export const getOutfitCategories = cache(async () => {
  const supabase = await createClient()

  const { data: outfitCategories } = await supabase
    .from('outfit_categories')
    .select('slug, title, type, part')
    .order('id', { ascending: true })

  return (outfitCategories ?? []) as OutfitCategory[]
})
```

- [ ] **Step 3: Create evolutions hook**

```typescript
// hooks/data/evolutions.ts
import { cache } from 'react'
import { Evolution } from '@/lib/types/outfit'
import { createClient } from '@/lib/supabase/server'

export const getEvolutions = cache(async () => {
  const supabase = await createClient()

  const { data: evolutions } = await supabase
    .from('evolutions')
    .select('slug, title, subtitle, description, order')
    .order('order', { ascending: true })

  return (evolutions ?? []) as Evolution[]
})
```

- [ ] **Step 4: Type-check**

```bash
yarn tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add hooks/data/abilities.ts hooks/data/outfit-categories.ts hooks/data/evolutions.ts
git commit -m "feat: add abilities, outfit_categories, and evolutions data hooks"
```

---

## Task 6: Outfit transform helpers

**Files:**

- Create: `hooks/outfit.ts`

These are pure functions that mirror `hooks/eureka.ts`. The key differences:

- `evolution` replaces `color` (no "default" or "iridescent" sorting rank — evolutions sort by their `order` field)
- `outfit_category` replaces `category`
- `outfit_set` replaces `eureka_set`

- [ ] **Step 1: Create the helpers file**

```typescript
// hooks/outfit.ts
import {
  Evolution,
  OutfitCategory,
  OutfitSet,
  OutfitVariant,
  ObtainedOutfit,
} from '@/lib/types/outfit'

export function sortOutfitVariants(
  variants: OutfitVariant[],
  defaultEvolutionSlug: string | null | undefined,
  categoryOrder: string[]
): OutfitVariant[] {
  return [...variants].sort((a, b) => {
    if (a.evolution === defaultEvolutionSlug && b.evolution !== defaultEvolutionSlug) return -1
    if (b.evolution === defaultEvolutionSlug && a.evolution !== defaultEvolutionSlug) return 1
    if (a.evolution !== b.evolution) return 0
    return (
      categoryOrder.indexOf(a.outfit_category ?? '') -
      categoryOrder.indexOf(b.outfit_category ?? '')
    )
  })
}

export function createOutfitSet({
  outfitSet,
  outfitCategories,
  evolutions,
}: {
  outfitSet: Omit<OutfitSet, 'created_at' | 'image_url' | 'outfit_categories' | 'evolutions'>
  outfitCategories: OutfitCategory[] | null
  evolutions: Evolution[] | null
}): OutfitSet {
  const defaultEvolutionSlug = outfitSet.outfit_variants.find((v) => v.default)?.evolution
  const categoryOrder = (outfitCategories ?? []).map((c) => c.slug)
  const evolutionSlugs = [...new Set(outfitSet.outfit_variants.map((v) => v.evolution))]
  const resolvedEvolutions = evolutionSlugs
    .flatMap((slug) => evolutions?.filter((e) => e.slug === slug) ?? [])
    .sort((a, b) => a.order - b.order)

  return {
    ...outfitSet,
    image_url: (
      outfitSet.outfit_variants.find((v) => v.default && v.outfit_category === 'hair') ??
      outfitSet.outfit_variants.find((v) => v.default)
    )?.image_url,
    outfit_categories: outfitCategories ?? [],
    evolutions: resolvedEvolutions,
    outfit_variants: sortOutfitVariants(
      outfitSet.outfit_variants as OutfitVariant[],
      defaultEvolutionSlug,
      categoryOrder
    ),
  } as OutfitSet
}

export function updateOutfitSet({
  outfitSet,
  obtainedOutfit,
}: {
  outfitSet: OutfitSet
  obtainedOutfit: ObtainedOutfit[] | null
}): OutfitSet {
  return {
    ...outfitSet,
    outfit_variants: outfitSet.outfit_variants.map((variant) => ({
      ...variant,
      obtained: !!obtainedOutfit?.find(
        (o) =>
          variant.outfit_set === o.outfit_set &&
          variant.outfit_category === o.outfit_category &&
          variant.evolution === o.evolution
      ),
    })) as OutfitVariant[],
  } as OutfitSet
}

export function updateOutfitVariants({
  outfitVariants,
  obtainedOutfit,
}: {
  outfitVariants: OutfitVariant[]
  obtainedOutfit: ObtainedOutfit[] | null
}): OutfitVariant[] {
  return outfitVariants.map((variant) => ({
    ...variant,
    obtained: !!obtainedOutfit?.find(
      (o) =>
        variant.outfit_set === o.outfit_set &&
        variant.outfit_category === o.outfit_category &&
        variant.evolution === o.evolution
    ),
  })) as OutfitVariant[]
}
```

- [ ] **Step 2: Type-check**

```bash
yarn tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add hooks/outfit.ts
git commit -m "feat: add outfit transform helpers (sortOutfitVariants, createOutfitSet, updateOutfitSet)"
```

---

## Task 7: obtained_outfit data hook

**Files:**

- Create: `hooks/data/obtained-outfit.ts`

- [ ] **Step 1: Create the hook**

```typescript
// hooks/data/obtained-outfit.ts
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ObtainedOutfit } from '@/lib/types/outfit'
import { UUID } from 'crypto'

export const getObtainedOutfit = cache(async (user_id: UUID | string) => {
  const supabase = await createClient()

  const { data: obtainedOutfit } = await supabase
    .from('obtained_outfit')
    .select('id, outfit_set, outfit_category, evolution')
    .eq('user_id', user_id)

  return (obtainedOutfit ?? []) as ObtainedOutfit[]
})
```

- [ ] **Step 2: Type-check**

```bash
yarn tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add hooks/data/obtained-outfit.ts
git commit -m "feat: add getObtainedOutfit data hook"
```

---

## Task 8: Outfit sets public data hook

**Files:**

- Create: `hooks/data/outfit-sets.ts`

- [ ] **Step 1: Create the hook**

```typescript
// hooks/data/outfit-sets.ts
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { OutfitSet, OutfitVariant } from '@/lib/types/outfit'
import { getUserID } from '../user'
import { getOutfitCategories } from './outfit-categories'
import { getEvolutions } from './evolutions'
import { getObtainedOutfit } from './obtained-outfit'
import { createOutfitSet, sortOutfitVariants, updateOutfitSet } from '../outfit'

export const getOutfitSets = cache(async () => {
  const supabase = await createClient()

  const { data: outfitSets } = await supabase
    .from('outfit_sets')
    .select(
      `
      id,
      slug,
      title,
      description,
      rarity,
      style,
      label,
      ability,
      updated_at,
      outfit_variants (
        id,
        slug,
        outfit_set,
        evolution,
        outfit_category,
        image_url,
        default
      )
    `
    )
    .order('id', { ascending: true })
    .order('id', { referencedTable: 'outfit_variants', ascending: true })

  const outfitCategories = await getOutfitCategories()
  const evolutions = await getEvolutions()
  const categoryOrder = outfitCategories.map((c) => c.slug)

  const outfits = (outfitSets ?? []).map((outfitSet) => {
    const defaultEvolutionSlug = outfitSet.outfit_variants.find((v) => v.default)?.evolution
    const evolutionSlugs = [...new Set(outfitSet.outfit_variants.map((v) => v.evolution))]
    const resolvedEvolutions = evolutionSlugs
      .flatMap((slug) => evolutions.filter((e) => e.slug === slug))
      .sort((a, b) => a.order - b.order)

    return {
      ...outfitSet,
      image_url: (
        outfitSet.outfit_variants.find((v) => v.default && v.outfit_category === 'hair') ??
        outfitSet.outfit_variants.find((v) => v.default)
      )?.image_url,
      outfit_categories: outfitCategories,
      evolutions: resolvedEvolutions,
      outfit_variants: sortOutfitVariants(
        outfitSet.outfit_variants as OutfitVariant[],
        defaultEvolutionSlug,
        categoryOrder
      ),
    }
  }) as OutfitSet[]

  const user_id = await getUserID()
  if (!user_id) return outfits

  const obtainedOutfit = await getObtainedOutfit(user_id)

  return outfits.map((outfitSet) => ({
    ...outfitSet,
    outfit_variants: outfitSet.outfit_variants.map((variant) => ({
      ...variant,
      obtained: !!obtainedOutfit.find(
        (o) =>
          variant.outfit_set === o.outfit_set &&
          variant.outfit_category === o.outfit_category &&
          variant.evolution === o.evolution
      ),
    })) as OutfitVariant[],
  })) as OutfitSet[]
})

export const getOutfitSet = cache(async (slug: string) => {
  const supabase = await createClient()

  const { data: outfitSet } = await supabase
    .from('outfit_sets')
    .select(
      `
      id,
      slug,
      title,
      description,
      rarity,
      style,
      label,
      ability,
      updated_at,
      outfit_variants (
        id,
        slug,
        outfit_set,
        evolution,
        outfit_category,
        image_url,
        default
      )
    `
    )
    .order('id', { ascending: true })
    .order('id', { referencedTable: 'outfit_variants', ascending: false })
    .eq('slug', slug)
    .single()

  if (!outfitSet) notFound()

  const outfitCategories = await getOutfitCategories()
  const evolutions = await getEvolutions()

  const outfit = createOutfitSet({ outfitSet, outfitCategories, evolutions })

  const user_id = await getUserID()
  if (!user_id) return outfit

  const obtainedOutfit = await getObtainedOutfit(user_id)

  return updateOutfitSet({ outfitSet: outfit, obtainedOutfit })
})
```

- [ ] **Step 2: Type-check**

```bash
yarn tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add hooks/data/outfit-sets.ts
git commit -m "feat: add getOutfitSets and getOutfitSet data hooks"
```

---

## Task 9: Admin data hooks

**Files:**

- Create: `hooks/data/admin/outfit-sets.ts`
- Create: `hooks/data/admin/outfit-variants.ts`

- [ ] **Step 1: Create admin outfit-sets hook**

```typescript
// hooks/data/admin/outfit-sets.ts
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { OutfitSetRaw } from '@/lib/types/outfit'

export const getOutfitSetsRaw = cache(async () => {
  const supabase = await createClient()

  const { data: outfitSets } = await supabase
    .from('outfit_sets')
    .select('id, slug, title, description, rarity, style, label, ability, updated_at')
    .order('updated_at', { ascending: false, nullsFirst: false })

  return (outfitSets ?? []) as OutfitSetRaw[]
})

export const getOutfitSetRaw = cache(async (slug: string) => {
  const supabase = await createClient()

  const { data: outfitSet } = await supabase
    .from('outfit_sets')
    .select('id, slug, title, description, rarity, style, label, ability, updated_at')
    .eq('slug', slug)
    .maybeSingle()

  return outfitSet as OutfitSetRaw | null
})
```

- [ ] **Step 2: Create admin outfit-variants hook**

```typescript
// hooks/data/admin/outfit-variants.ts
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { OutfitVariantRaw } from '@/lib/types/outfit'

export const getOutfitVariantsRaw = cache(async () => {
  const supabase = await createClient()

  const { data: outfitVariants } = await supabase
    .from('outfit_variants')
    .select(
      `
      id,
      slug,
      outfit_set,
      evolution,
      outfit_category,
      image_url,
      default,
      updated_at,
      outfit_sets ( title ),
      outfit_categories ( title ),
      evolutions ( title )
      `
    )
    .order('id', { ascending: false })

  return (outfitVariants ?? []) as OutfitVariantRaw[]
})

export const getOutfitVariantRaw = cache(async (slug: string) => {
  const supabase = await createClient()

  const { data: outfitVariant } = await supabase
    .from('outfit_variants')
    .select(
      `
      id,
      slug,
      outfit_set,
      evolution,
      outfit_category,
      image_url,
      default,
      updated_at,
      outfit_sets ( title ),
      outfit_categories ( title ),
      evolutions ( title )
      `
    )
    .eq('slug', slug)
    .maybeSingle()

  return outfitVariant as OutfitVariantRaw | null
})
```

- [ ] **Step 3: Type-check**

```bash
yarn tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add hooks/data/admin/outfit-sets.ts hooks/data/admin/outfit-variants.ts
git commit -m "feat: add admin outfit-sets and outfit-variants data hooks"
```

---

## Verification

After all tasks are complete:

1. **Migrations applied cleanly:**

   ```bash
   supabase db push
   ```

   Expected: Both migrations already applied (or apply without error).

2. **All tables visible in Supabase Studio:** Open the Table Editor and verify `abilities`, `outfit_categories`, `evolutions`, `outfit_sets`, `outfit_variants`, `obtained_outfit` all appear.

3. **RLS is working:** In Supabase Studio SQL editor, run as anon role and confirm you can `SELECT` from `outfit_sets` but `INSERT` is rejected. Confirm `INSERT` succeeds when running as an admin user.

4. **toggle_obtained_outfit works:** In SQL editor (authenticated as a test user):

   ```sql
   select toggle_obtained_outfit('some-outfit-slug', 'some-category-slug', 'some-evolution-slug');
   select * from obtained_outfit;
   -- Run again — should delete the row
   select toggle_obtained_outfit('some-outfit-slug', 'some-category-slug', 'some-evolution-slug');
   select * from obtained_outfit;
   ```

5. **TypeScript compiles:**

   ```bash
   yarn tsc --noEmit
   ```

   Expected: No errors.

6. **Dev server starts cleanly:**
   ```bash
   yarn dev
   ```
   Expected: No runtime errors related to the new types or hooks.
