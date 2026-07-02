# Standalone Pieces as a Set Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the 8 standalone outfit pieces a first-class `standalone-pieces` set with a slug page, obtained toggling, and filters, by re-keying `obtained_outfit` on the variant slug.

**Architecture:** A DB migration creates a real `outfit_sets` row, re-points the standalone variants to it, and adds an `outfit_variant` column to `obtained_outfit` that becomes the unique obtained key (backfilled for all variants, orphans deleted). The app layer switches obtained matching from `(outfit_set, outfit_category)` to `variant.slug`, updates the toggle RPC/action to a 3-arg form, and removes the now-redundant `standaloneVariants` special-casing so standalone-pieces flows through the normal set pipeline.

**Tech Stack:** Next.js 16 App Router, Supabase (Postgres + RPC), TypeScript, MUI. Package manager: **Yarn**.

## Global Constraints

- Package manager is **Yarn**. Never use npm/pnpm.
- Prettier: no semicolons, single quotes, 2-space indent, 100 char width. The PostToolUse hook runs `yarn format && yarn lint:fix` then `yarn tsc --noEmit` after every edit.
- **No test framework exists.** The per-task "test cycle" is: `yarn tsc --noEmit` (type-check), `yarn lint` (no new errors), and targeted DB verification queries via Supabase MCP `execute_sql` (project_id `ykfuevyqpjvtxidjnhxm`). Read-only verification SQL only during dev; schema changes go through migration files.
- `git add` paths containing `[slug]` brackets MUST be single-quoted (zsh glob): `git add 'app/outfits/[slug]/file.tsx'`.
- Branch is `feat/standalone-pieces-as-set` (already created, design doc committed). Commit per task; do NOT push or open a PR until the user asks.
- `outfit_sets.rarity` has CHECK `rarity BETWEEN 2 AND 5` — the placeholder rarity for the standalone set must be `2`.
- Migration files: `supabase/migrations/YYYYMMDDHHMMSS_name.sql`. Next number after `20260630000006`. Use `20260701000001_...`. Plain SQL (no explicit BEGIN/COMMIT wrapper — follow the existing files, which run bare statements).
- Apply migrations with `supabase db push --include-all`. Regenerate types with `supabase gen types typescript --project-id $(cat supabase/.temp/project-ref) > lib/types/supabase.ts`.
- Obtained matching source of truth becomes `outfit_variant` (= `variant.slug`). Keep `outfit_set` + `outfit_category` columns populated.

---

### Task 1: DB migration — standalone set, re-point, obtained_variant key

**Files:**

- Create: `supabase/migrations/20260701000001_standalone_pieces_as_set.sql`

**Interfaces:**

- Produces: `outfit_sets` row `standalone-pieces`; `obtained_outfit.outfit_variant text NOT NULL` (FK → `outfit_variants.slug`); `toggle_obtained_outfit(p_outfit_set text, p_outfit_category text, p_outfit_variant text)`.

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/20260701000001_standalone_pieces_as_set.sql`:

```sql
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
```

- [ ] **Step 2: Apply the migration**

Run: `supabase db push --include-all`
Expected: applies `20260701000001_standalone_pieces_as_set.sql` with no error.

- [ ] **Step 3: Verify via DB queries (Supabase MCP execute_sql, project ykfuevyqpjvtxidjnhxm)**

Run these and confirm expected results:

```sql
-- (a) standalone set exists, 8 variants re-pointed
select (select count(*) from outfit_sets where slug='standalone-pieces') as set_rows,
       (select count(*) from outfit_variants where outfit_set='standalone-pieces') as variants,
       (select count(*) from outfit_variants where outfit_set is null) as still_null;
-- expect: set_rows=1, variants=8, still_null=0

-- (b) every obtained row has a variant, none null, orphans gone
select count(*) as total, count(outfit_variant) as with_variant,
       count(*) filter (where outfit_variant is null) as null_variant
from obtained_outfit;
-- expect: total = with_variant, null_variant = 0  (total ≈ 10843)

-- (c) uniqueness + FK in place
select conname from pg_constraint
where conrelid = 'public.obtained_outfit'::regclass
  and conname in ('obtained_outfit_unique','obtained_outfit_variant_fkey');
-- expect: both rows present
```

- [ ] **Step 4: Regenerate Supabase types**

Run: `supabase gen types typescript --project-id $(cat supabase/.temp/project-ref) > lib/types/supabase.ts`
Expected: `obtained_outfit` Row/Insert now includes `outfit_variant`; `toggle_obtained_outfit` Args include `p_outfit_variant`.

- [ ] **Step 5: Type-check**

Run: `yarn tsc --noEmit`
Expected: no errors introduced by the regenerated types (existing code still compiles because columns were added, not removed).

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260701000001_standalone_pieces_as_set.sql lib/types/supabase.ts
git commit -m "feat(db): standalone-pieces set + outfit_variant obtained key

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Types + obtained matching by variant slug

**Files:**

- Modify: `lib/types/outfit.ts` (ObtainedOutfit pick)
- Modify: `hooks/outfit.ts:113-144` (updateOutfitSet, updateOutfitVariants)

**Interfaces:**

- Consumes: `obtained_outfit.outfit_variant` from Task 1's regenerated types.
- Produces: `ObtainedOutfit` type with `outfit_variant: string`; obtained matching keyed on `variant.slug`.

- [ ] **Step 1: Add outfit_variant to the ObtainedOutfit type**

In `lib/types/outfit.ts`, change the `ObtainedOutfit` pick:

```typescript
export type ObtainedOutfit = Pick<
  Tables<'obtained_outfit'>,
  'id' | 'outfit_set' | 'outfit_category' | 'outfit_variant'
>
```

- [ ] **Step 2: Switch matching to variant slug in hooks/outfit.ts**

In `hooks/outfit.ts`, both `updateOutfitSet` (line ~124) and `updateOutfitVariants` (line ~140) currently match:

```typescript
      obtained: !!obtainedOutfit?.find(
        (o) => variant.outfit_set === o.outfit_set && variant.outfit_category === o.outfit_category
      ),
```

Replace **both** occurrences with a variant-slug match:

```typescript
      obtained: !!obtainedOutfit?.find((o) => o.outfit_variant === variant.slug),
```

- [ ] **Step 3: Type-check**

Run: `yarn tsc --noEmit`
Expected: no errors. (`OutfitVariant` already includes `slug`; `ObtainedOutfit` now has `outfit_variant`.)

- [ ] **Step 4: Commit**

```bash
git add lib/types/outfit.ts hooks/outfit.ts
git commit -m "feat(outfits): match obtained by variant slug

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Toggle action (3-arg) + detail-page obtained match

**Files:**

- Modify: `app/outfits/actions.ts`
- Modify: `app/outfits/[slug]/outfit-set-detail.tsx:59` (obtained match ONLY — this file has no toggle call)
- Modify: `app/outfits/[slug]/outfit-evolution-variants.tsx:31` (obtained match ONLY — this file has no toggle call)

**Interfaces:**

- Consumes: `handleObtainedOutfit` will require a 3rd arg.
- Produces: `handleObtainedOutfit(outfit_set: string, outfit_category: string, outfit_variant: string)`.

> **Verified:** `outfit-set-detail.tsx` and `outfit-evolution-variants.tsx` do NOT call `handleObtainedOutfit` or any toggle — they only compute an `obtained` match. The single-toggle call lives in `outfit-variant-card.tsx` (Task 5); the batch payloads live in `outfit-set-section.tsx` / `filter-outfits.tsx` (Task 5).

- [ ] **Step 1: Update the server action signature + RPC call**

In `app/outfits/actions.ts`, replace the function body:

```typescript
export async function handleObtainedOutfit(
  outfit_set: string,
  outfit_category: string,
  outfit_variant: string
) {
  const user_id = await getUserID()
  if (!user_id) throw new Error('Not authenticated')

  const supabase = await createClient()

  const { error } = await supabase.rpc('toggle_obtained_outfit', {
    p_outfit_set: outfit_set,
    p_outfit_category: outfit_category,
    p_outfit_variant: outfit_variant,
  })

  if (error) {
    console.error('toggle_obtained_outfit failed:', error)
    throw new Error(error.message)
  }
}
```

- [ ] **Step 2: Switch the two detail-page obtained matches to variant slug**

These files only compute an `obtained` match (no toggle call). In `app/outfits/[slug]/outfit-set-detail.tsx` at line ~59, the `.find(...)` predicate reads `(o) => o.outfit_set === v.outfit_set && o.outfit_category === v.outfit_category`. Replace that predicate with `(o) => o.outfit_variant === v.slug`. Apply the identical replacement in `app/outfits/[slug]/outfit-evolution-variants.tsx` at line ~31.

Confirm both are the only occurrences:

Run: `grep -n "outfit_category === v" 'app/outfits/[slug]/outfit-set-detail.tsx' 'app/outfits/[slug]/outfit-evolution-variants.tsx'`
Expected: after editing, no matches remain.

- [ ] **Step 3: Type-check**

Run: `yarn tsc --noEmit`
Expected: no errors. (`v` is an `OutfitVariant`, which has `slug`; `ObtainedOutfit` has `outfit_variant` from Task 2.)

- [ ] **Step 4: Commit**

```bash
git add app/outfits/actions.ts 'app/outfits/[slug]/outfit-set-detail.tsx' 'app/outfits/[slug]/outfit-evolution-variants.tsx'
git commit -m "feat(outfits): 3-arg obtained toggle action + detail match by slug

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Provider optimistic state + realtime keyed on variant slug

**Files:**

- Modify: `app/outfits/outfit-data-provider.tsx` (handleToggleObtained ~146, handleBatchToggleObtained ~167, realtime INSERT dedup ~239, batch/single callers)
- Modify: `app/api/obtained-outfit/route.ts` (select outfit_variant)
- Modify: `hooks/data/obtained-outfit.ts` (select outfit_variant)

**Interfaces:**

- Consumes: `handleObtainedOutfit(set, category, variant)` from Task 3; `ObtainedOutfit.outfit_variant` from Task 2.
- Produces: provider obtained state matched/toggled by `outfit_variant`; API + hook return `outfit_variant`.

- [ ] **Step 1: Select outfit_variant in the obtained queries**

In `hooks/data/obtained-outfit.ts`, `getObtainedOutfit` select becomes:

```typescript
      .select('id, outfit_set, outfit_category, outfit_variant')
```

In `app/api/obtained-outfit/route.ts`, find the `obtained_outfit` `.select(...)` and add `outfit_variant` to the selected columns (match existing formatting).

- [ ] **Step 2: Re-key handleToggleObtained on variant slug**

In `app/outfits/outfit-data-provider.tsx`, `handleToggleObtained` currently takes `(outfit_set, outfit_category)`. Change it to accept the variant identity and key on `outfit_variant`:

```typescript
const handleToggleObtained = async (
  outfit_set: string,
  outfit_category: string,
  outfit_variant: string
) => {
  const saved = obtainedOutfit
  const isObtained = obtainedOutfit.some((o) => o.outfit_variant === outfit_variant)
  if (isObtained) {
    setObtainedOutfit((prev) => prev.filter((o) => o.outfit_variant !== outfit_variant))
  } else {
    setObtainedOutfit((prev) => [...prev, { id: -1, outfit_set, outfit_category, outfit_variant }])
  }
  try {
    await handleObtainedOutfit(outfit_set, outfit_category, outfit_variant)
  } catch (err) {
    console.error('Failed to toggle obtained outfit:', err)
    setObtainedOutfit(saved)
    enqueueSnackbar('Failed to update your collection. Please try again.', { variant: 'error' })
  }
}
```

- [ ] **Step 3: Re-key handleBatchToggleObtained on variant slug**

Replace `handleBatchToggleObtained` so its variant payload carries `outfit_variant` and matching keys on it:

```typescript
const handleBatchToggleObtained = async (
  variants: Array<{ outfit_set: string; outfit_category: string; outfit_variant: string }>,
  targetObtained: boolean
) => {
  const saved = obtainedOutfit
  const matches = (o: { outfit_variant: string | null }, v: { outfit_variant: string }) =>
    o.outfit_variant === v.outfit_variant

  if (targetObtained) {
    setObtainedOutfit((prev) => {
      const toAdd = variants
        .filter((v) => !prev.some((o) => matches(o, v)))
        .map((v) => ({ id: -1, ...v }))
      return [...prev, ...toAdd]
    })
  } else {
    setObtainedOutfit((prev) => prev.filter((o) => !variants.some((v) => matches(o, v))))
  }

  for (const v of variants) {
    try {
      await handleObtainedOutfit(v.outfit_set, v.outfit_category, v.outfit_variant)
    } catch (err) {
      console.error('Failed to batch toggle obtained outfit:', err)
      setObtainedOutfit(saved)
      enqueueSnackbar('Failed to update your collection. Please try again.', { variant: 'error' })
      return
    }
  }
}
```

- [ ] **Step 4: Re-key the realtime INSERT dedup on variant slug**

In the realtime `INSERT` handler (~line 239), the placeholder-removal currently matches on `outfit_set` + `outfit_category`. Replace that block's matching with `outfit_variant`:

```typescript
setObtainedOutfit((prev) => {
  const withoutPlaceholder = prev.filter(
    (o) => !(o.id === -1 && o.outfit_variant === incoming.outfit_variant)
  )
  if (withoutPlaceholder.some((o) => o.id === incoming.id)) return prev
  return [...withoutPlaceholder, incoming]
})
```

- [ ] **Step 5: Update the context type for onToggleObtained + onBatchToggleObtained**

In `components/outfits/outfit-context.tsx`, update the two signatures to include `outfit_variant`:

```typescript
  onToggleObtained: (outfit_set: string, outfit_category: string, outfit_variant: string) => void
  onBatchToggleObtained: (
    variants: Array<{ outfit_set: string; outfit_category: string; outfit_variant: string }>,
    targetObtained: boolean
  ) => void
```

Update the default no-op context value if its typed signature complains (the `() => {}` defaults are assignable, so likely no change needed — confirm with tsc).

- [ ] **Step 6: Type-check (expect errors at set-section/card/filter callers — fixed in Task 5)**

Run: `yarn tsc --noEmit`
Expected: errors ONLY at the batch/single toggle call sites in `outfit-set-section.tsx`, `outfit-set-card.tsx`, `filter-outfits.tsx` (they still build payloads without `outfit_variant`). These are fixed in Task 5. No other errors.

- [ ] **Step 7: Commit**

```bash
git add app/outfits/outfit-data-provider.tsx app/api/obtained-outfit/route.ts hooks/data/obtained-outfit.ts components/outfits/outfit-context.tsx
git commit -m "feat(outfits): key provider obtained state on variant slug

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Update toggle callers to include variant slug

**Files:**

- Modify: `app/outfits/outfit-set-section.tsx:48-56` (batch handleToggle payload)
- Modify: `app/outfits/filter-outfits.tsx:282-290` (batch OutfitSetCard onToggle payload)
- Modify: `app/outfits/outfit-variant-card.tsx:32` (single onToggleObtained call)

**Interfaces:**

- Consumes: `onBatchToggleObtained(variants: {outfit_set, outfit_category, outfit_variant}[], target)` and `onToggleObtained(set, category, variant)` from Task 4.
- Produces: all batch payloads include `outfit_variant: v.slug`; the single-toggle call passes the variant slug.

> **Verified:** `outfit-set-card.tsx` builds NO payload — it only calls the `onToggle` prop; its payload is built by `filter-outfits.tsx` (Step 3). So `outfit-set-card.tsx` needs no change. The only single-toggle call is `outfit-variant-card.tsx:32` (Step 4).

- [ ] **Step 1: Find every toggle payload/call**

Run: `grep -rn "onBatchToggleObtained\|onToggleObtained(\|outfit_set: v.outfit_set!" app/outfits`

- [ ] **Step 2: Add outfit_variant to outfit-set-section.tsx**

In `app/outfits/outfit-set-section.tsx` `handleToggle` (~line 49), the map produces `{ outfit_set, outfit_category }`. Add the slug:

```typescript
const toToggle = groupVariants
  .filter((v) => !!v.obtained === allObtained)
  .map((v) => ({
    outfit_set: v.outfit_set!,
    outfit_category: v.outfit_category!,
    outfit_variant: v.slug,
  }))
```

- [ ] **Step 3: Add outfit_variant in filter-outfits.tsx OutfitSetCard onToggle**

In `app/outfits/filter-outfits.tsx` (~line 283), the `toToggle` map similarly builds `{ outfit_set, outfit_category }`. Add `outfit_variant: v.slug`:

```typescript
const toToggle = variants
  .filter((v) => v.obtained === allObtained)
  .map((v) => ({
    outfit_set: v.outfit_set!,
    outfit_category: v.outfit_category!,
    outfit_variant: v.slug,
  }))
```

- [ ] **Step 4: Add the variant slug to the single-toggle call**

In `app/outfits/outfit-variant-card.tsx` at line ~32, the call reads:

```typescript
onToggleObtained(outfitVariant.outfit_set!, outfitVariant.outfit_category!)
```

Add the variant slug as the third argument:

```typescript
onToggleObtained(outfitVariant.outfit_set!, outfitVariant.outfit_category!, outfitVariant.slug)
```

Then confirm no other single-toggle sites remain:

Run: `grep -rn "onToggleObtained(" app/outfits components`
Expected: only the updated `outfit-variant-card.tsx` call, now 3-arg.

- [ ] **Step 5: Type-check**

Run: `yarn tsc --noEmit`
Expected: no errors — all toggle payloads and calls now include the variant slug.

- [ ] **Step 6: Lint**

Run: `yarn lint`
Expected: no new errors (pre-existing warnings in unrelated files are fine).

- [ ] **Step 7: Commit**

```bash
git add app/outfits/outfit-set-section.tsx app/outfits/filter-outfits.tsx app/outfits/outfit-variant-card.tsx
git commit -m "feat(outfits): include variant slug in toggle payloads

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Remove standaloneVariants special-casing

**Files:**

- Modify: `app/api/outfits/route.ts` (drop standaloneVariants from payload)
- Modify: `app/outfits/outfit-data-provider.tsx` (drop standalone state + context value)
- Modify: `components/outfits/outfit-context.tsx` (drop standaloneVariants from type + default)
- Modify: `app/outfits/filter-outfits.tsx` (drop filteredStandalone + standalone render blocks)

**Interfaces:**

- Consumes: nothing new — standalone pieces now arrive inside `outfitSets` as the `standalone-pieces` set.
- Produces: a leaner context with no `standaloneVariants`.

- [ ] **Step 1: Drop standaloneVariants from the API route**

In `app/api/outfits/route.ts`: remove `const standaloneVariants = variantsBySet.get('') ?? []` and both `standaloneVariants` keys in the two `NextResponse.json({...})` returns. Returns become `{ outfitSets: outfits }` and `{ outfitSets: outfitsWithObtained }`.

- [ ] **Step 2: Drop standalone state from the provider**

In `app/outfits/outfit-data-provider.tsx`:

- Remove the `standaloneVariants` state (`const [standaloneVariants, setStandaloneVariants] = ...`, line ~42).
- Change the fetch type + destructure to only `outfitSets`: `fetchJson<{ outfitSets: OutfitSet[] }>('/api/outfits')` and `.then(({ outfitSets: sets }) => { setOutfitSets(sets); ... })` (drop `setStandaloneVariants(standalone)`).
- Remove `standaloneVariants,` from the context provider value (~line 282).

- [ ] **Step 3: Drop standaloneVariants from the context type**

In `components/outfits/outfit-context.tsx`: remove `standaloneVariants: OutfitVariant[]` from the interface and `standaloneVariants: [],` from the default context value. Remove the now-unused `OutfitVariant` import if nothing else uses it (check with tsc/lint).

- [ ] **Step 4: Remove standalone rendering from filter-outfits.tsx**

In `app/outfits/filter-outfits.tsx`:

- Remove `standaloneVariants,` from the `useOutfitData()` destructure (~line 56).
- Remove the `filteredStandalone` computation (~lines 207-214).
- In the empty-state condition (~line 242) change `filteredSets.length === 0 && filteredStandalone.length === 0` → `filteredSets.length === 0`.
- In the compact-view condition (~line 300) change `(filteredSets.length > 0 || filteredStandalone.length > 0)` → `filteredSets.length > 0`.
- Remove the two `filteredStandalone.map(...)` blocks and the "Standalone pieces" header `Box`/`Button` block (~lines 307-345) — keep only the `groupBySet ? (...) : (...)` set rendering.
- Remove now-unused imports: `ChevronRight`, `Button`, and `Divider`/`Typography`/`Stack` only if no longer referenced (verify with lint).

- [ ] **Step 5: Type-check**

Run: `yarn tsc --noEmit`
Expected: no errors. If `OutfitVariant` or an icon import is now unused, remove it.

- [ ] **Step 6: Lint**

Run: `yarn lint`
Expected: no new errors. Remove any unused-import warnings introduced by this task.

- [ ] **Step 7: Commit**

```bash
git add app/api/outfits/route.ts app/outfits/outfit-data-provider.tsx components/outfits/outfit-context.tsx app/outfits/filter-outfits.tsx
git commit -m "refactor(outfits): drop standaloneVariants; standalone is now a set

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Verify slug page + detail rendering, manual smoke test

**Files:**

- Read/verify: `app/outfits/[slug]/outfit-set-detail.tsx` (graceful null ability/season/rarity)

**Interfaces:**

- Consumes: `getOutfitSet('standalone-pieces')` returning the new set.
- Produces: a working `/outfits/standalone-pieces` page — no new code expected, just verification.

- [ ] **Step 1: Confirm detail degrades with null set-level fields**

Read `app/outfits/[slug]/outfit-set-detail.tsx` and confirm the ability, season, rarity-stars, evolutions, and carousel sections are conditional (render only when data present). The standalone set has rarity 2, null ability/season, no evolutions, no carousel. If any section would crash on null (e.g. `.map` on undefined), add a guard. Note findings; only edit if a real null-crash exists.

- [ ] **Step 2: Start dev server**

Run: `yarn dev`
Expected: compiles, serves on localhost:3000.

- [ ] **Step 3: Manual smoke test (report results)**

Verify in the browser (logged in):

- `/outfits/standalone-pieces` loads and lists all 8 hair pieces.
- Toggling one piece's obtained status persists (reload → still toggled) and does NOT toggle the others (this is the core fix — same-category pieces are independent).
- The main `/outfits` page shows a "Standalone Pieces" set card (standard) and section (compact); no separate/duplicated standalone block remains.
- A regular set's obtained toggling still works (regression check).

Report what you observed. If the independence check fails, STOP — the obtained key is not wired to the variant slug somewhere.

- [ ] **Step 4: Final type-check + lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: clean (no new errors).

- [ ] **Step 5: Commit any guards added**

```bash
git add -A
git commit -m "fix(outfits): guard standalone set detail rendering

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

(Skip this commit if Step 1 required no edits.)

---

## Notes for the implementer

- **Migration is irreversible in prod** (deletes 17 orphan rows, drops the old unique constraint). It's already been validated against the live data counts in the design doc. Do not re-run against a DB that already has the migration.
- The whole point of the feature is that **obtained keys on `variant.slug`**. If two same-category pieces ever toggle together, a call site is still building an obtained match on `(outfit_set, outfit_category)` — grep for `outfit_category === ` in `app/outfits` and `hooks/outfit.ts` to find it.
- Keep `outfit_set`/`outfit_category` populated in every insert/optimistic-placeholder — the profile stats/recent-updates queries and the kept FKs still read them.
