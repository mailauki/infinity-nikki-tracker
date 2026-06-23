# Merge `evolutions` into `outfit_sets` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify `outfit_sets` and `evolutions` into one `outfit_sets` table where every row is an outfit state (base/evolution/glow-up), removing the `{set}-base` placeholder rows and the parallel evolutions/carousel tables.

**Architecture:** One forward-only Supabase migration restructures the schema and backfills data; types are regenerated; then the app cuts over to the unified model in dependency order — transforms (`hooks/outfit.ts`) first, then data hooks, then admin, then read paths. Roles are derived: base = `base_set IS NULL` (order 1), glow-up = `order 0`, evolution = `order >= 2`.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase (Postgres + RLS + RPC), MUI v9, TypeScript, Yarn.

## Global Constraints

- Package manager: **Yarn** (never npm/pnpm).
- Code style: no semicolons, single quotes, 2-space indent, 100-char width (Prettier auto-runs via PostToolUse hook).
- Path alias `@/` = project root.
- **No test framework exists in this repo.** The per-task gate is: `./node_modules/.bin/tsc --noEmit` passes AND `yarn lint` passes. `yarn dlx tsc` resolves to a decoy package — always use `./node_modules/.bin/tsc`. Migration tasks add SQL verification queries. There are NO unit tests to write.
- **Role rules (verbatim):** base set ⟺ `base_set IS NULL` (its `order` = 1); glow-up ⟺ `order = 0`; regular evolution ⟺ `order >= 2`.
- **Slugs:** base rows keep their clean slug (`froggy_fashion`); evolution/glow-up rows keep `{set}-{subtitle}`. Base-state references migrate `{set}-base` → `{set}`.
- **Display order:** base (1) → evolutions (2,3,…) → glow-up (0 last). Sort key: `order === 0 ? Infinity : order`.
- **Collapse:** `outfit_variants.evolution` and `obtained_outfit.evolution` are dropped; their `outfit_set` column holds the specific state slug.
- **Migration is forward-only**; take a DB backup before applying to production; dry-run on a Supabase branch first.
- `git add` paths containing `[slug]` must be quoted (zsh glob).
- Commit message footer: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Spec: `docs/superpowers/specs/2026-06-22-merge-evolutions-into-outfit-sets-design.md`.

## Sequencing note

Tasks 1–2 (migration + type regen) are the irreversible gate and must land before any consumer task. Tasks 3+ depend on the regenerated types. After Task 1 the app will NOT type-check until Task 2 regenerates types and at least the transforms (Task 3) are updated — this is expected; the branch is not deployable until the full cutover (through Task 9) is complete. Do not deploy a partial branch.

---

## File Structure

- **Migration (new):** `supabase/migrations/20260622000001_merge_evolutions_into_outfit_sets.sql` — schema + data backfill, the 10 ordered steps from the spec.
- **Types:** `lib/types/supabase.ts` (regenerated), `lib/types/outfit.ts` (hand-edited domain types).
- **Transforms:** `hooks/outfit.ts` — `createOutfitSet`, `updateOutfitSet`, `updateOutfitVariants`, `sortOutfitVariants`, `isEvolutionVisible`, plus new `isGlowup`/`evolutionSortKey` helpers.
- **Data hooks:** `hooks/data/outfit-sets.ts`, `hooks/data/evolutions.ts`, `hooks/data/obtained-outfit.ts`, `hooks/data/admin/outfit-sets.ts`, `hooks/data/admin/recents.ts`.
- **Admin:** `app/admin/outfits/sets/actions.ts`, `app/admin/outfits/sets/edit/[slug]/{page.tsx,edit-outfit-set-form.tsx}`, `app/admin/outfits/sets/new/add-outfit-set-form.tsx`, `app/admin/outfits/sets/evolution-editor.tsx`, `app/admin/outfits/sets/outfit-set-table.tsx`, `app/admin/outfits/evolutions/**`.
- **Read paths:** `app/api/outfits/route.ts`, `app/api/obtained-outfit/route.ts`, `app/outfits/seasons/[slug]/season-outfit-list.tsx`, `components/outfits/**`, `app/profile/**`, `components/looks/look-builder.tsx`, `lib/look-utils.ts`, `components/forms/carousel-image-upload.tsx`.
- **Toggle server action:** wherever `toggle_obtained_outfit` is invoked (outfit obtained action).

---

### Task 1: Schema migration + data backfill

**Files:**

- Create: `supabase/migrations/20260622000001_merge_evolutions_into_outfit_sets.sql`

**Interfaces:**

- Produces: a migrated DB where `outfit_sets` has `order`/`base_set`, no `glowup_evolution`; `outfit_variants`/`obtained_outfit` have no `evolution`; `evolutions`/`evolution_carousel_images` dropped; `toggle_obtained_outfit(text, text)`.

- [ ] **Step 1: Take a backup / prepare a dry-run target**

Before anything: snapshot the DB (Supabase dashboard → Database → Backups, or `pg_dump`). For the dry run, create/seed a Supabase branch or a local copy. Do not run against production until the dry-run verification (Step 4) passes.

- [ ] **Step 2: Write the migration SQL**

Create `supabase/migrations/20260622000001_merge_evolutions_into_outfit_sets.sql` implementing the spec's 10 ordered steps:

```sql
-- 20260622000001_merge_evolutions_into_outfit_sets.sql
-- Merge evolutions into outfit_sets: every row is an outfit state.
-- base = base_set IS NULL (order 1); glow-up = order 0; evolution = order >= 2.

begin;

-- 1. New columns on outfit_sets.
alter table public.outfit_sets add column if not exists "order" int;
alter table public.outfit_sets add column if not exists base_set text;
update public.outfit_sets set "order" = 1 where "order" is null;

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

-- 3. Repoint base-state references {set}-base -> {set} (clean base slug).
update public.outfit_variants v
set outfit_set = left(v.evolution, length(v.evolution) - length('-base'))
where v.evolution like '%-base';

-- 4. Collapse outfit_variants: evolution variants -> outfit_set = evolution slug;
--    base variants already set in step 3. Then drop the evolution column.
update public.outfit_variants v
set outfit_set = v.evolution
where v.evolution is not null and v.evolution not like '%-base';

alter table public.outfit_variants drop column evolution;

-- 5. Collapse obtained_outfit: evolution rows -> outfit_set = evolution slug;
--    base rows (evolution is null) keep their clean outfit_set.
update public.obtained_outfit o
set outfit_set = o.evolution
where o.evolution is not null;

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
```

- [ ] **Step 3: Apply the migration to the dry-run target**

Run: `supabase db push --include-all` (against the branch/copy). Expected: completes without FK or constraint errors.

- [ ] **Step 4: Verify the dry-run data**

Run these checks (via `supabase db execute` equivalent or the SQL editor on the branch). Expected results in comments:

```sql
-- No base placeholder rows remain anywhere:
select count(*) from public.outfit_sets where slug like '%-base';            -- 0
select count(*) from public.outfit_variants where outfit_set like '%-base';  -- 0
-- Base sets count unchanged (compare to pre-migration outfit_sets where order would be 1):
select count(*) from public.outfit_sets where base_set is null;              -- = original set count
-- Evolution rows = original non-base evolutions:
select count(*) from public.outfit_sets where base_set is not null;          -- = original non-base evo count
-- Every variant resolves to an outfit_sets row:
select count(*) from public.outfit_variants v
  left join public.outfit_sets s on s.slug = v.outfit_set where s.slug is null;  -- 0
-- Every obtained row resolves:
select count(*) from public.obtained_outfit o
  left join public.outfit_sets s on s.slug = o.outfit_set where s.slug is null;  -- 0
-- At most one glow-up per set:
select base_set, count(*) from public.outfit_sets
  where "order" = 0 group by base_set having count(*) > 1;                   -- 0 rows
```

If any check fails, fix the migration and re-run against a fresh copy. Do not proceed to production until all pass.

- [ ] **Step 5: Apply to production**

After dry-run verification passes and a production backup exists: `supabase db push --include-all` against production.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260622000001_merge_evolutions_into_outfit_sets.sql
git commit -m "feat(db): merge evolutions into outfit_sets

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Regenerate Supabase types + update domain types

**Files:**

- Modify: `lib/types/supabase.ts` (regenerated)
- Modify: `lib/types/outfit.ts`

**Interfaces:**

- Consumes: the migrated DB (Task 1).
- Produces: `OutfitSet` with `order: number`, `base_set: string | null`, no `glowup_evolution`; `OutfitVariant` with `outfit_set: string`, no `evolution`; `Evolution` aliased to an `outfit_sets` row with `order != 1`; `ObtainedOutfit` with no `evolution`.

- [ ] **Step 1: Regenerate generated types**

Run: `supabase gen types typescript --project-id $(cat supabase/.temp/project-ref) > lib/types/supabase.ts`
Expected: `outfit_sets` Row gains `order: number` and `base_set: string | null`, loses `glowup_evolution`; `outfit_variants`/`obtained_outfit` lose `evolution`; `evolutions`/`evolution_carousel_images` removed.

- [ ] **Step 2: Update `lib/types/outfit.ts`**

Read the file, then: remove `glowup_evolution` from `OutfitSet`; add `order: number` and `base_set: string | null`; remove `evolution` from `OutfitVariant` and `ObtainedOutfit`; redefine `Evolution` as an outfit-set row representing a non-base state (`order !== 1`). If `Evolution` is structurally identical to `OutfitSet` now, alias it: `export type Evolution = OutfitSet`. Keep `carousel_images` on `OutfitSet`.

- [ ] **Step 3: Verify types compile in isolation**

Run: `./node_modules/.bin/tsc --noEmit 2>&1 | head -40`
Expected: errors now point only at _consumers_ of the changed fields (`hooks/outfit.ts`, data hooks, components) — NOT at `lib/types/*` themselves. This confirms the type surface changed correctly; the consumer errors are fixed in Tasks 3+.

- [ ] **Step 4: Commit**

```bash
git add lib/types/supabase.ts lib/types/outfit.ts
git commit -m "feat(types): regenerate types for merged outfit_sets/evolutions

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Rewrite `hooks/outfit.ts` transforms

**Files:**

- Modify: `hooks/outfit.ts`

**Interfaces:**

- Consumes: `OutfitSet`/`OutfitVariant`/`ObtainedOutfit`/`Evolution` from Task 2.
- Produces (exact signatures later tasks rely on):
  - `isGlowup(row: { order: number }): boolean` — `row.order === 0`
  - `evolutionSortKey(row: { order: number }): number` — `row.order === 0 ? Infinity : row.order`
  - `isBaseRow(row: { base_set: string | null }): boolean` — `row.base_set === null`
  - `createOutfitSet({ outfitSet, outfitCategories, evolutions }): OutfitSet` — unchanged call shape; new internals
  - `updateOutfitSet({ outfitSet, obtainedOutfit }): OutfitSet`
  - `updateOutfitVariants({ outfitVariants, obtainedOutfit }): OutfitVariant[]`
  - `sortOutfitVariants(variants, defaultStateSlug, categoryOrder): OutfitVariant[]`
  - `isEvolutionVisible({ stateSlug, baseSlug, isGlowupState, hideEvolutions, hideGlowups }): boolean`

- [ ] **Step 1: Add `isGlowup`, `evolutionSortKey`, `isBaseRow` helpers**

Add to `hooks/outfit.ts`:

```ts
export function isGlowup(row: { order: number }): boolean {
  return row.order === 0
}

// Display order: base (1) -> evolutions (2,3,...) -> glow-up (0, last).
export function evolutionSortKey(row: { order: number }): number {
  return row.order === 0 ? Infinity : row.order
}

export function isBaseRow(row: { base_set: string | null }): boolean {
  return row.base_set === null
}
```

- [ ] **Step 2: Rewrite `sortOutfitVariants` to key on state slug**

Variants now carry `outfit_set` = state slug (no `evolution`). Default group is the base state slug:

```ts
export function sortOutfitVariants(
  variants: OutfitVariant[],
  defaultStateSlug: string | null | undefined,
  categoryOrder: string[]
): OutfitVariant[] {
  return [...variants].sort((a, b) => {
    if (a.outfit_set === defaultStateSlug && b.outfit_set !== defaultStateSlug) return -1
    if (b.outfit_set === defaultStateSlug && a.outfit_set !== defaultStateSlug) return 1
    if (a.outfit_set !== b.outfit_set) return 0
    return (
      categoryOrder.indexOf(a.outfit_category ?? '') -
      categoryOrder.indexOf(b.outfit_category ?? '')
    )
  })
}
```

- [ ] **Step 3: Rewrite `isEvolutionVisible`**

Glow-up identified by state role, not a glowup slug:

```ts
export function isEvolutionVisible({
  stateSlug,
  baseSlug,
  isGlowupState,
  hideEvolutions,
  hideGlowups,
}: {
  stateSlug: string | null
  baseSlug: string
  isGlowupState: boolean
  hideEvolutions: boolean
  hideGlowups: boolean
}): boolean {
  if (stateSlug === baseSlug) return true
  if (isGlowupState) return !hideGlowups
  return !hideEvolutions
}
```

- [ ] **Step 4: Rewrite `createOutfitSet`**

The set is the base row; its evolutions are the rows whose `base_set` equals the set slug, sorted by `evolutionSortKey`. Base variants are those whose `outfit_set` equals the base slug. Remove all `{set}-base` logic:

```ts
export function createOutfitSet({
  outfitSet,
  outfitCategories,
  evolutions,
}: {
  outfitSet: Omit<OutfitSet, 'created_at' | 'outfit_categories' | 'evolutions'>
  outfitCategories: OutfitCategory[] | null
  evolutions: Evolution[] | null
}): OutfitSet {
  const categoryOrder = (outfitCategories ?? []).map((c) => c.slug)
  const baseSlug = outfitSet.slug

  // Evolutions of this set = rows whose base_set points back to it, in display order.
  const resolvedEvolutions = (evolutions ?? [])
    .filter((e) => e.base_set === baseSlug)
    .sort((a, b) => evolutionSortKey(a) - evolutionSortKey(b))

  return {
    ...outfitSet,
    image_url:
      outfitSet.image_url ??
      outfitSet.outfit_variants.find(
        (v) => v.outfit_set === baseSlug && v.outfit_category === 'hair'
      )?.image_url ??
      outfitSet.outfit_variants.find((v) => v.outfit_set === baseSlug)?.image_url,
    outfit_categories: outfitCategories ?? [],
    evolutions: resolvedEvolutions,
    outfit_variants: sortOutfitVariants(
      outfitSet.outfit_variants as OutfitVariant[],
      baseSlug,
      categoryOrder
    ),
  } as OutfitSet
}
```

- [ ] **Step 5: Rewrite `updateOutfitSet` / `updateOutfitVariants` obtained matching**

Obtained rows now key on `(outfit_set, outfit_category)` only (no `evolution`):

```ts
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
        (o) => variant.outfit_set === o.outfit_set && variant.outfit_category === o.outfit_category
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
      (o) => variant.outfit_set === o.outfit_set && variant.outfit_category === o.outfit_category
    ),
  })) as OutfitVariant[]
}
```

- [ ] **Step 6: Verify**

Run: `./node_modules/.bin/tsc --noEmit 2>&1 | head -40`
Expected: errors in `hooks/outfit.ts` itself are gone; remaining errors are in data hooks / components (fixed in later tasks).

- [ ] **Step 7: Commit**

```bash
git add hooks/outfit.ts
git commit -m "feat(outfits): rewrite transforms for merged outfit_sets model

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Update outfit data hooks

**Files:**

- Modify: `hooks/data/outfit-sets.ts`
- Modify: `hooks/data/evolutions.ts`
- Modify: `hooks/data/obtained-outfit.ts`

**Interfaces:**

- Consumes: transforms from Task 3.
- Produces: `getOutfitSets()`/`getOutfitSet(slug)` returning base sets with resolved evolution siblings; `getEvolutions()` returning `outfit_sets` rows where `base_set is not null`; `getObtainedOutfit(user_id)` returning rows without `evolution`.

- [ ] **Step 1: Update `hooks/data/evolutions.ts`**

`getEvolutions` now selects from `outfit_sets` where `base_set is not null` (these are the evolution/glow-up rows), selecting the unified columns (`slug, title, order, base_set, description, image_url, alt_image_url`, plus carousel via `outfit_set_carousel_images`). Remove the old `evolutions`-table select and the `subtitle != 'base'` filter (base rows are now `base_set is null`, naturally excluded).

```ts
export const getEvolutions = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('outfit_sets')
    .select('id, slug, title, "order", base_set, description, image_url, alt_image_url')
    .not('base_set', 'is', null)
    .order('order', { ascending: true })
  return data ?? []
})
```

(Keep `getEvolutionsWithVariants`/`getEvolutionsByOutfitSet` working by selecting from `outfit_sets` with the same `base_set is not null` filter and joining `outfit_variants` on `outfit_set = slug`; preserve their existing return shapes used by the admin evolutions section.)

- [ ] **Step 2: Update `hooks/data/outfit-sets.ts`**

In both `getOutfitSets` and `getOutfitSet`: drop `glowup_evolution` and the `evolution` field inside `outfit_variants` from the select; add `"order"` and `base_set`; filter the top-level query to base rows (`.is('base_set', null)`) so only sets are returned (evolutions come via `getEvolutions`). The `createOutfitSet` call shape is unchanged.

```ts
// In the .select(...) for outfit_sets, replace the glowup_evolution line with:
//   "order",
//   base_set,
// and inside outfit_variants(...) remove the `evolution,` line.
// After .from('outfit_sets'): add .is('base_set', null) to getOutfitSets
// (getOutfitSet already filters by .eq('slug', slug), which only matches base
//  slugs for set detail pages — confirm detail pages pass base slugs).
```

- [ ] **Step 3: Update `hooks/data/obtained-outfit.ts`**

Remove `evolution` from the `obtained_outfit` select; the returned rows now carry `(outfit_set, outfit_category)` keys.

- [ ] **Step 4: Verify**

Run: `./node_modules/.bin/tsc --noEmit 2>&1 | head -40`
Expected: errors in these three files gone; remaining errors in admin/components.

- [ ] **Step 5: Commit**

```bash
git add hooks/data/outfit-sets.ts hooks/data/evolutions.ts hooks/data/obtained-outfit.ts
git commit -m "feat(outfits): update data hooks for merged model

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Update the obtained-outfit toggle (server action + API)

**Files:**

- Modify: `app/api/obtained-outfit/route.ts`
- Modify: `app/outfits/actions.ts` (the `handleObtainedOutfit` action)

**Interfaces:**

- Consumes: the `toggle_obtained_outfit(text, text)` RPC (Task 1).
- Produces: an obtained toggle keyed on `(outfit_set, outfit_category)` only.

- [ ] **Step 1: Update the RPC call sites**

Find every `rpc('toggle_obtained_outfit', { ... })` call (in `app/outfits/actions.ts` and/or `app/api/obtained-outfit/route.ts`) and drop the `p_evolution` argument so it matches the new two-arg signature. Remove any `{set}-base` end-to-end handling described in the route comments.

- [ ] **Step 2: Verify**

Run: `./node_modules/.bin/tsc --noEmit 2>&1 | head -40`
Expected: no errors in these files.

- [ ] **Step 3: Commit**

```bash
git add app/api/obtained-outfit/route.ts app/outfits/actions.ts
git commit -m "feat(outfits): drop evolution arg from obtained toggle

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Rewrite outfit-sets admin writer

**Files:**

- Modify: `app/admin/outfits/sets/actions.ts`
- Modify: `app/admin/outfits/sets/new/add-outfit-set-form.tsx`
- Modify: `app/admin/outfits/sets/edit/[slug]/page.tsx`
- Modify: `app/admin/outfits/sets/edit/[slug]/edit-outfit-set-form.tsx`
- Modify: `app/admin/outfits/sets/evolution-editor.tsx`

**Interfaces:**

- Consumes: merged schema; transforms from Task 3.
- Produces: `addOutfitSet`/`editOutfitSet` that create/update the base row plus sibling evolution/glow-up rows (with copied set fields, `order`, `base_set`), writing `order = 0` for the glow-up.

- [ ] **Step 1: Rewrite `addOutfitSet`**

Read `app/admin/outfits/sets/actions.ts`. Replace base-evolution creation: insert the base set row (`order = 1`, `base_set = null`) as today; for each evolution draft insert an `outfit_sets` row with `slug = '{set}-{toSlug(subtitle)}'`, `title = subtitle`, `order` from the draft, `base_set = {set}`, and `rarity/style/ability/seasons/season_category/label/label_2` copied from the base set values just inserted. Insert base variants with `outfit_set = {set}`; evolution variants with `outfit_set = {evolution-slug}`. For the glow-up: after inserting evolution rows, set the chosen evolution row's `order = 0`. Remove all `{set}-base` slug construction and the `glowup_evolution` update.

- [ ] **Step 2: Rewrite `editOutfitSet`**

Same model: update the base row; diff/insert/delete sibling evolution rows by `base_set = {set}`; keep set-level fields in sync across siblings (re-copy on edit); set the glow-up sibling's `order = 0` and reset any previously-0 sibling that's no longer the glow-up back to its draft order. Remove the base-evolution rename block and `glowup_evolution` writes. Variant image/title/description updates now key on the state slug (`outfit_set`), not `evolution`.

- [ ] **Step 3: Update the glow-up selector + forms**

In `evolution-editor.tsx`, `edit-outfit-set-form.tsx`, `add-outfit-set-form.tsx`, `edit/[slug]/page.tsx`: the glow-up is chosen by order/sibling, written as `order = 0`. Replace `glowup_evolution` reads (e.g. `page.tsx:88-89` computing `initialGlowupEvolutionOrder` from `glowup_evolution`) with "the sibling whose `order === 0`". Replace `isBaseVariant` (`edit-outfit-set-form.tsx:113-179`) to test the owning row: a variant is base when its `outfit_set` equals the base slug (`order === 1` row). Remove `{set}-base` constructions.

- [ ] **Step 4: Verify**

Run: `./node_modules/.bin/tsc --noEmit 2>&1 | head -40`
Expected: no errors in these files.

- [ ] **Step 5: Commit**

```bash
git add app/admin/outfits/sets/actions.ts app/admin/outfits/sets/new/add-outfit-set-form.tsx 'app/admin/outfits/sets/edit/[slug]/page.tsx' 'app/admin/outfits/sets/edit/[slug]/edit-outfit-set-form.tsx' app/admin/outfits/sets/evolution-editor.tsx
git commit -m "feat(admin): rewrite outfit set writer for merged model

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Update outfit-sets admin table + evolutions admin section

**Files:**

- Modify: `app/admin/outfits/sets/outfit-set-table.tsx`
- Modify: `app/admin/outfits/evolutions/page.tsx`
- Modify: `app/admin/outfits/evolutions/outfit-evolution-view.tsx`
- Modify: `app/admin/outfits/evolutions/outfit-evolution-table.tsx`
- Modify: `app/admin/outfits/evolutions/edit/[slug]/page.tsx`
- Modify: `app/admin/outfits/evolutions/edit/[slug]/edit-evolution-form.tsx`
- Modify: `app/admin/outfits/evolutions/edit/[slug]/actions.ts`
- Modify: `hooks/data/admin/outfit-sets.ts`, `hooks/data/admin/recents.ts`

**Interfaces:**

- Consumes: merged schema; `getEvolutions`/`getEvolutionsWithVariants` from Task 4; `isGlowup`/`evolutionSortKey` from Task 3.

- [ ] **Step 1: Update `outfit-set-table.tsx`**

Replace the base-variant lookup (`outfit-set-table.tsx:204-211`, `v.evolution === \`${row.slug}-base\``) with `v.outfit_set === row.slug`(base variants belong to the base row). Replace the`glowup_evolution` column (`:355-356`) and `LOCKED_FIELDS`entry: the Glow-Up column reads the set's evolution siblings and shows the one with`order === 0`(or derive a boolean). Drop`glowup_evolution`from`LOCKED_FIELDS` (`:48`); add nothing unless a new locked field is needed.

- [ ] **Step 2: Update the evolutions admin section**

These pages now operate on `outfit_sets` rows where `base_set is not null`:

- `page.tsx` + `outfit-evolution-view.tsx`: list rows from `getEvolutions`/`getEvolutionsWithVariants`; the `subtitle !== 'base'` filter (`outfit-evolution-view.tsx:21`) is no longer needed (base rows are excluded by `base_set is not null`); sort with `evolutionSortKey`.
- `outfit-evolution-table.tsx`: columns read `title`/`order`/`base_set` from the unified row; "Set Title" comes from the base row (join via `base_set`).
- `edit/[slug]/page.tsx` + `edit-evolution-form.tsx` + `actions.ts`: load/save the `outfit_sets` row (not `evolutions`). The `editEvolution` action updates `outfit_sets`; carousel writes go to `outfit_set_carousel_images`. The "Update & next item" query (added in PR #211) retargets to `outfit_sets where base_set is not null`, ordered by base-set title then `evolutionSortKey`; it already excludes base because base rows have `base_set is null`.

- [ ] **Step 3: Update admin data hooks**

`hooks/data/admin/outfit-sets.ts` and `recents.ts`: drop `glowup_evolution`/`evolution` from selects; add `order`/`base_set` where the views need them.

- [ ] **Step 4: Verify**

Run: `./node_modules/.bin/tsc --noEmit 2>&1 | head -40`
Expected: no errors in these files.

- [ ] **Step 5: Commit**

```bash
git add app/admin/outfits/sets/outfit-set-table.tsx app/admin/outfits/evolutions hooks/data/admin/outfit-sets.ts hooks/data/admin/recents.ts
git commit -m "feat(admin): update tables + evolutions section for merged model

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Update public read paths (outfits grid, seasons, detail, context/provider)

**Files:**

- Modify: `app/api/outfits/route.ts`
- Modify: `app/outfits/seasons/[slug]/season-outfit-list.tsx`
- Modify: `components/outfits/outfit-data-provider.tsx`, `outfit-context.tsx`, `outfit-set-card.tsx`, `outfit-set-detail.tsx`, `outfit-set-section.tsx`, `outfit-evolution-variants.tsx`, `outfit-variant-card.tsx`, `outfit-toolbar.tsx`, `filter-outfits.tsx`

**Interfaces:**

- Consumes: transforms (Task 3), data hooks (Task 4).

- [ ] **Step 1: Update the outfits API route**

`app/api/outfits/route.ts`: remove the `{set}-base` end-to-end comment/logic; serialize from the unified model (base = `base_set is null` row, evolutions resolved by `createOutfitSet`).

- [ ] **Step 2: Update season list grouping**

`season-outfit-list.tsx`: the synthetic "base" entry becomes the base row itself; replace `set.glowup_evolution === evolution.slug` (`:48`) with `isGlowup(evolution)`; replace `baseEvoSlug = \`${set.slug}-base\`` (`:19`) with `set.slug`; `glowupSlug`/`baseSlug`usages rekey to state slugs /`isGlowup`.

- [ ] **Step 3: Update outfit components**

Across `components/outfits/*`: replace every `evolution`-keyed reference with the state slug (`outfit_set`) and every glow-up check with `isGlowup`/`order === 0`; `isEvolutionVisible` calls use the new param names (`stateSlug`, `isGlowupState`). `filter-outfits.tsx:127-136` base-group construction uses the base row. `outfit-evolution-variants.tsx` groups variants by their `outfit_set` (state) slug.

- [ ] **Step 4: Verify**

Run: `./node_modules/.bin/tsc --noEmit 2>&1 | head -40`
Expected: no errors in these files.

- [ ] **Step 5: Commit**

```bash
git add app/api/outfits/route.ts 'app/outfits/seasons/[slug]/season-outfit-list.tsx' components/outfits
git commit -m "feat(outfits): update public read paths for merged model

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: Update profile, looks, carousel upload, and memory; final gate

**Files:**

- Modify: `app/profile/outfit-collection-charts.tsx`, `app/profile/profile-stats.tsx`, `app/profile/outfit-recent-updates.tsx`
- Modify: `components/looks/look-builder.tsx`, `lib/look-utils.ts`
- Modify: `components/forms/carousel-image-upload.tsx`
- Modify: `app/admin/page.tsx` (if it references evolution/glowup)
- Update memory: `.../memory/base-evolution-normalization.md` + `MEMORY.md` pointer

**Interfaces:**

- Consumes: everything from Tasks 3–4.

- [ ] **Step 1: Update profile completion math**

`outfit-collection-charts.tsx:442` and `profile-stats.tsx:18-19`: base variants identified by their owning row (`outfit_set` = base slug, i.e. the `order === 1` row), not `\`${set.slug}-base\``. `outfit-recent-updates.tsx`: drop `evolution` references.

- [ ] **Step 2: Update looks**

`look-builder.tsx:72-78` and `lib/look-utils.ts`: "base" state derived from the row's role (`base_set === null` / `order === 1`) rather than the string `'base'`; evolution label from `title`/`order`.

- [ ] **Step 3: Update carousel upload + admin dashboard**

`components/forms/carousel-image-upload.tsx`: the `table="evolution_carousel_images"` usage (evolution edit form) now writes to `outfit_set_carousel_images`. `app/admin/page.tsx`: drop any evolution/glowup references that no longer resolve.

- [ ] **Step 4: Update the memory note**

Read `.../memory/base-evolution-normalization.md`. Replace its content: base is now identified by `base_set IS NULL` (clean slug), glow-up by `order === 0`; there is no `{set}-base` row and no `evolutions` table; resolve via `createOutfitSet()`. Update the one-line hook in `MEMORY.md` if needed.

- [ ] **Step 5: Final full gate**

Run: `./node_modules/.bin/tsc --noEmit` (expect exit 0, no output) and `yarn lint` (expect exit 0) and `yarn build` (expect success).
Then grep for leftovers: `grep -rnE "glowup_evolution|\\\\{set\\\\}-base|'-base'|evolution_carousel_images|\.evolution\b" app/ hooks/ components/ lib/ | grep -v node_modules` — expect no functional references remain (comments referencing history are fine if accurate).

- [ ] **Step 6: Commit**

```bash
git add app/profile components/looks lib/look-utils.ts components/forms/carousel-image-upload.tsx app/admin/page.tsx
git commit -m "feat(outfits): update profile/looks/carousel for merged model

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

(Memory files are outside the repo working tree — write them directly; no commit needed.)

---

### Task 10: Manual verification

**Files:** none (verification only).

- [ ] **Step 1: Start dev server**

Run: `yarn dev`. Expected: server on localhost:3000.

- [ ] **Step 2: Verify as a logged-in admin + user**

1. `/outfits` grid shows only base sets (one card per set, no `-base` duplicates).
2. An outfit detail shows states in order: base → evolutions → glow-up (last).
3. Toggle an obtained variant (base and an evolution) — persists across reload.
4. Season pages group correctly; glow-up toggle hides only `order = 0` states; evolution toggle hides only `order >= 2`.
5. Profile completion percentages match pre-migration values for a known account.
6. Admin: add a new set with one evolution + a glow-up; edit it; confirm round-trip and that "Update & next item" walks evolution rows (skipping base) in display order.

- [ ] **Step 3: Stop dev server.**

---

## Self-Review

**Spec coverage:**

- Target schema (`order`, `base_set`, dropped `glowup_evolution`, role rules) → Task 1 + Task 2. ✓
- Base keeps clean slug; base refs `{set}-base` → `{set}` → Task 1 steps 3–5. ✓
- Glow-up = `order 0`, displayed last → Task 1 step 7, Task 3 `isGlowup`/`evolutionSortKey`. ✓
- Collapse variant/obtained FKs; merge carousel; obtained unique index; toggle RPC → Task 1 steps 4–6, 8; Task 5. ✓
- `default` trigger order-based → Task 1 step 8. ✓
- Transforms rewrite → Task 3. Data hooks → Task 4. Admin → Tasks 6–7. Read paths → Task 8. Profile/looks/memory → Task 9. ✓
- Forward-only migration + backup + dry-run → Task 1 steps 1, 3–5. ✓
- Verification (tsc/lint/build, data checks, manual) → Task 1 step 4, Task 9 step 5, Task 10. ✓

**Placeholder scan:** Migration SQL and transform code are complete and concrete. Consumer tasks (6–9) describe edits against named files/line ranges with the exact replacement rule (e.g. "`v.evolution === \`${row.slug}-base\``→`v.outfit_set === row.slug`") rather than full file rewrites, because those files are large (400–526 lines) and mostly unrelated to the change; the implementer reads each file and applies the named, mechanical substitution. The discriminator rules and helper signatures are specified verbatim in Tasks 2–3 so every consumer edit has a concrete target.

**Type consistency:** Helper names (`isGlowup`, `evolutionSortKey`, `isBaseRow`), the `(outfit_set, outfit_category)` obtained key, the `stateSlug`/`isGlowupState` params of `isEvolutionVisible`, and the two-arg `toggle_obtained_outfit` are used consistently across Tasks 3, 5, 7, 8, 9.

**Note on TDD:** the writing-plans skill assumes a test framework; this repo has none, so tasks use tsc/lint/build + SQL data-verification as the gate instead of unit tests. This is intentional and matches the repo (and the prior PR #211).
