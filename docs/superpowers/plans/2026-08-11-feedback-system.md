# Feedback System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `mailto:`-based help forms with DB-backed feedback submissions that support real image uploads, per-page issue reporting with auto-captured context, an in-app receipt, and an admin triage surface.

**Architecture:** One `feedback` table plus a `feedback_images` child table and a private storage bucket. All submissions — anonymous and authenticated alike — go through a single `POST /api/feedback` route holding the service-role key, so there is exactly one write path to validate and rate-limit. A shared `feedback-form.tsx` replaces the two duplicate forms; a `ReportIssueLink` in the global nav footer covers every page with no per-page wiring. Admin triage follows the existing DataGrid pattern.

**Tech Stack:** Next.js 16 (App Router, Cache Components), React 19, MUI v9, `@mui/x-data-grid` v9, Supabase (Postgres + Storage), `sharp` for server-side image re-encoding, Vitest + React Testing Library for tests, Yarn 4.

## Global Constraints

- **Package manager is Yarn 4.** Use `yarn add`, never `npm install`. Only `dev/build/start/lint/format/lint:fix` exist as scripts today; this plan adds `test`.
- **Type-check with `yarn tsc --noEmit`** — NOT `yarn dlx tsc`, which fetches a bogus placeholder package.
- **Never push directly to `main`.** All work lands on the `feat/feedback-system` branch (already created). Load the `git-workflow` skill before any commit, push, PR, or merge.
- **API routes that read auth must call `await connection()` first**, outside the try/catch, so the PPR prerender-abort signal propagates to React instead of being swallowed as a 500.
- **React `cache()` is for reads only.** Never wrap a mutation in `cache()` — it silently no-ops on repeated calls with the same args.
- **`use cache` cannot call `cookies()`.** Auth-dependent hooks use React `cache()`; only public lookups use `use cache` + `createPublicClient()`.
- **Prettier:** no semicolons, single quotes, 2-space indent, 100 char width, ES5 trailing commas. A PostToolUse hook runs `prettier --write` + `eslint --fix` on every edited file automatically.
- **Path alias `@/` maps to the project root.**
- **MUI `Stack` does not accept layout shorthands** (`justifyContent`, `alignItems`) as direct props — put them in `sx` or it is a TypeScript build error.
- **`git add` with `[slug]` paths must be quoted** in zsh: `git add 'app/admin/.../[slug]/page.tsx'`.
- **Never create or edit any file whose path contains `.env`** — including `.env.example`. A
  PreToolUse hook blocks Edit/Write on them, and bypassing it via Bash is not acceptable. Surface
  the needed lines in your task report for the user to add.
- **Email receipt (Resend) is explicitly out of scope for this plan.** It is deferred by user decision. The `receipt_sent_at` column is created now so no migration is needed when it lands, but nothing writes to it. Task 9 is the placeholder marker only.

---

## File Structure

**Created:**

| File                                               | Responsibility                                            |
| -------------------------------------------------- | --------------------------------------------------------- |
| `vitest.config.ts`                                 | Vitest + React plugin, jsdom env, `@/` alias              |
| `vitest.setup.ts`                                  | RTL matchers, global cleanup                              |
| `supabase/migrations/<ts>_add_feedback_tables.sql` | Tables, indexes, RLS, storage bucket                      |
| `lib/types/feedback.ts`                            | Domain types + category/status constants                  |
| `lib/feedback/entity-from-path.ts`                 | Pure pathname → `{entity_type, entity_slug}` parser       |
| `lib/feedback/validate.ts`                         | Pure submission validation, shared shape for route + form |
| `lib/feedback/rate-limit.ts`                       | IP hashing + windowed counter against Postgres            |
| `lib/feedback/images.ts`                           | `sharp` re-encode + storage upload                        |
| `app/api/feedback/route.ts`                        | The single POST write path                                |
| `components/feedback/feedback-form.tsx`            | Shared form, both types                                   |
| `components/feedback/feedback-receipt.tsx`         | In-app receipt success view                               |
| `components/feedback/image-picker.tsx`             | Upload control with previews                              |
| `components/feedback/report-context.tsx`           | Optional display-name provider                            |
| `components/feedback/report-issue-link.tsx`        | Footer entry point                                        |
| `hooks/data/admin/feedback.ts`                     | Admin reads (React `cache()`)                             |
| `app/admin/feedback/page.tsx`                      | Admin list server component                               |
| `app/admin/feedback/feedback-view.tsx`             | Admin DataGrid client view                                |
| `app/admin/feedback/actions.ts`                    | Status/notes mutations (NOT cached)                       |
| `app/admin/feedback/[id]/page.tsx`                 | Detail view with signed image URLs                        |

**Modified:** `package.json` (deps + `test` script), `lib/types/supabase.ts` (regenerated), `app/help/help-actions.tsx` (use shared form), `components/navbar/nav-footer.tsx` (mount link), `app/admin/admin-nav-menu.tsx` (nav entry).

**Deleted:** `app/help/bug-report-form.tsx`, `app/help/feature-request-form.tsx`.

---

### Task 1: Test infrastructure

**Files:**

- Create: `vitest.config.ts`, `vitest.setup.ts`, `lib/__tests__/sanity.test.ts`
- Modify: `package.json`

**Interfaces:**

- Consumes: nothing.
- Produces: `yarn test` (single run) and `yarn test:watch`. All later tasks rely on `yarn test` existing and on `@/` resolving inside tests.

- [ ] **Step 1: Install dev dependencies**

```bash
yarn add -D vitest@^3 @vitejs/plugin-react@^5 jsdom@^26 \
  @testing-library/react@^16 @testing-library/jest-dom@^6 @testing-library/user-event@^14
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    // Exclude the Next build output and deps; without this vitest walks .next
    // and tries to run compiled chunks as tests.
    exclude: ['node_modules/**', '.next/**'],
  },
  resolve: {
    alias: { '@': resolve(__dirname, './') },
  },
})
```

- [ ] **Step 3: Create `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
```

- [ ] **Step 4: Add scripts to `package.json`**

Add to the `scripts` object:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Write a sanity test at `lib/__tests__/sanity.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/utils'

describe('test infrastructure', () => {
  it('runs tests and resolves the @/ alias', () => {
    expect(cn('a', 'b')).toBe('a b')
  })
})
```

- [ ] **Step 6: Run the test**

Run: `yarn test`
Expected: PASS, 1 test. This proves both the runner and the `@/` alias work.

- [ ] **Step 7: Verify the build is unaffected**

Run: `yarn tsc --noEmit`
Expected: no errors. If `vitest.config.ts` raises a type error about `defineConfig`, ensure `vitest` is in `devDependencies` and re-run.

- [ ] **Step 8: Commit**

```bash
git add package.json yarn.lock vitest.config.ts vitest.setup.ts lib/__tests__/sanity.test.ts
git commit -m "test: add vitest with react testing library"
```

---

### Task 2: Database migration

**Files:**

- Create: `supabase/migrations/<timestamp>_add_feedback_tables.sql`
- Modify: `lib/types/supabase.ts` (regenerated, do not hand-edit)

**Interfaces:**

- Consumes: nothing.
- Produces: tables `feedback`, `feedback_images`, `feedback_rate_limit`; private storage bucket `feedback`. Generated types `Tables<'feedback'>` and `Tables<'feedback_images'>` used by every later task.

- [ ] **Step 1: Create the migration file**

Name it with a current timestamp, e.g. `supabase/migrations/20260811120000_add_feedback_tables.sql`:

```sql
-- Feedback submissions: feature requests and issue reports.
-- All writes go through the API route with the service-role key; no client
-- role gets INSERT, which keeps validation and rate limiting on one path.
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('feature', 'issue')),
  category text not null,
  title text not null check (char_length(title) between 1 and 200),
  description text not null check (char_length(description) between 1 and 5000),
  email text,
  -- SET NULL, not CASCADE: a bug report stays useful after the reporter
  -- deletes their account.
  user_id uuid references auth.users (id) on delete set null,
  page_path text,
  entity_type text,
  entity_slug text,
  entity_title text,
  user_agent text,
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'resolved', 'declined')),
  admin_notes text,
  -- Reserved for the deferred email receipt; nothing writes it yet.
  receipt_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index feedback_status_created_idx on public.feedback (status, created_at desc);
create index feedback_type_idx on public.feedback (type);

create table public.feedback_images (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback (id) on delete cascade,
  path text not null,
  created_at timestamptz not null default now()
);

create index feedback_images_feedback_id_idx on public.feedback_images (feedback_id);

-- Windowed per-IP counter. A DB table rather than an in-memory map because
-- Fluid Compute reuses instances unpredictably, so an in-memory counter
-- under-counts whenever a request lands on a fresh instance.
-- ip_hash is a salted digest, never a raw address.
create table public.feedback_rate_limit (
  ip_hash text not null,
  window_start timestamptz not null,
  count integer not null default 1,
  primary key (ip_hash, window_start)
);

create index feedback_rate_limit_window_idx on public.feedback_rate_limit (window_start);

alter table public.feedback enable row level security;
alter table public.feedback_images enable row level security;
alter table public.feedback_rate_limit enable row level security;

-- Admin-only read/update. No INSERT policy for any client role: the service
-- role bypasses RLS and is the only writer.
create policy "Admins can read feedback"
  on public.feedback for select
  using ((select public.is_admin()));

create policy "Admins can update feedback"
  on public.feedback for update
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can delete feedback"
  on public.feedback for delete
  using ((select public.is_admin()));

create policy "Admins can read feedback images"
  on public.feedback_images for select
  using ((select public.is_admin()));

-- feedback_rate_limit intentionally has RLS enabled and NO policies:
-- only the service role touches it.

-- Private bucket: screenshots can show a user's account, collection, or email.
insert into storage.buckets (id, name, public)
values ('feedback', 'feedback', false)
on conflict (id) do nothing;

create policy "Admins can read feedback screenshots"
  on storage.objects for select
  using (bucket_id = 'feedback' and (select public.is_admin()));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger feedback_set_updated_at
  before update on public.feedback
  for each row execute function public.set_updated_at();
```

- [ ] **Step 2: Check whether `set_updated_at` already exists**

Run: `grep -rn "set_updated_at\|update_updated_at" supabase/migrations/ | head`

If a function with this name already exists in an earlier migration, delete the `create or replace function` block from Step 1 and keep only the trigger, pointing at the existing function name. Duplicating it is harmless because of `create or replace`, but only if the signature matches exactly.

- [ ] **Step 3: Apply the migration**

Run: `supabase db push`

Expected: applies without error. Load the `git-workflow` skill first — it documents the Supabase CLI gotchas for this repo.

- [ ] **Step 4: Verify the schema landed**

Run this against the project (Supabase SQL editor or `supabase db execute`):

```sql
select table_name from information_schema.tables
where table_schema = 'public' and table_name like 'feedback%'
order by table_name;
```

Expected exactly three rows: `feedback`, `feedback_images`, `feedback_rate_limit`.

Then confirm the bucket is private:

```sql
select id, public from storage.buckets where id = 'feedback';
```

Expected: one row, `public = false`. **If `public` is true, stop and fix it** — a public bucket would expose every uploaded screenshot by URL.

- [ ] **Step 5: Regenerate types**

Run: `supabase gen types typescript --linked > lib/types/supabase.ts`

- [ ] **Step 6: Verify the generated types compile**

Run: `yarn tsc --noEmit`
Expected: no errors.

Confirm the new tables are present:
Run: `grep -c "feedback" lib/types/supabase.ts`
Expected: a non-zero count.

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations lib/types/supabase.ts
git commit -m "feat(db): add feedback tables, RLS, and private storage bucket"
```

---

### Task 3: Domain types and the pathname parser

**Files:**

- Create: `lib/types/feedback.ts`, `lib/feedback/entity-from-path.ts`, `lib/feedback/__tests__/entity-from-path.test.ts`

**Interfaces:**

- Consumes: `Tables<>` from `lib/types/supabase.ts` (Task 2).
- Produces:
  - `type FeedbackType = 'feature' | 'issue'`
  - `type FeedbackStatus = 'new' | 'in_progress' | 'resolved' | 'declined'`
  - `FEATURE_CATEGORIES` / `ISSUE_CATEGORIES: readonly string[]`
  - `categoriesFor(type: FeedbackType): readonly string[]`
  - `interface ReportContext { page_path: string; entity_type: string | null; entity_slug: string | null; entity_title: string | null }`
  - `entityFromPath(pathname: string): { entity_type: string | null; entity_slug: string | null }`

- [ ] **Step 1: Create `lib/types/feedback.ts`**

```ts
import type { Tables } from '@/lib/types/supabase'

export type Feedback = Tables<'feedback'>
export type FeedbackImage = Tables<'feedback_images'>

export type FeedbackType = 'feature' | 'issue'
export type FeedbackStatus = 'new' | 'in_progress' | 'resolved' | 'declined'

export const FEEDBACK_STATUSES: readonly FeedbackStatus[] = [
  'new',
  'in_progress',
  'resolved',
  'declined',
]

export const FEATURE_CATEGORIES = ['New feature', 'Improvement', 'Other'] as const
export const ISSUE_CATEGORIES = ['Bug report', 'Missing content', 'Other'] as const

export function categoriesFor(type: FeedbackType): readonly string[] {
  return type === 'feature' ? FEATURE_CATEGORIES : ISSUE_CATEGORIES
}

// Limits mirrored by the server; the form uses them for inline validation so
// users see the cap before submitting rather than after a 400.
export const MAX_TITLE_LENGTH = 200
export const MAX_DESCRIPTION_LENGTH = 5000
export const MAX_IMAGES = 3
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export interface ReportContext {
  page_path: string
  entity_type: string | null
  entity_slug: string | null
  entity_title: string | null
}
```

- [ ] **Step 2: Write the failing test at `lib/feedback/__tests__/entity-from-path.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { entityFromPath } from '@/lib/feedback/entity-from-path'

describe('entityFromPath', () => {
  it('extracts type and slug from a detail route', () => {
    expect(entityFromPath('/eureka/blossoming_dream')).toEqual({
      entity_type: 'eureka',
      entity_slug: 'blossoming_dream',
    })
  })

  it('handles every known detail domain', () => {
    expect(entityFromPath('/outfits/ballet_dream')).toEqual({
      entity_type: 'outfits',
      entity_slug: 'ballet_dream',
    })
    expect(entityFromPath('/makeup/soft_glow')).toEqual({
      entity_type: 'makeup',
      entity_slug: 'soft_glow',
    })
    expect(entityFromPath('/momo-cloaks/starry')).toEqual({
      entity_type: 'momo-cloaks',
      entity_slug: 'starry',
    })
    expect(entityFromPath('/looks/my_look')).toEqual({
      entity_type: 'looks',
      entity_slug: 'my_look',
    })
  })

  it('extracts nested detail routes', () => {
    expect(entityFromPath('/eureka/trials/pear_blossom')).toEqual({
      entity_type: 'eureka-trials',
      entity_slug: 'pear_blossom',
    })
    expect(entityFromPath('/outfits/seasons/spring')).toEqual({
      entity_type: 'outfits-seasons',
      entity_slug: 'spring',
    })
  })

  it('returns no entity for collection index routes', () => {
    expect(entityFromPath('/eureka')).toEqual({ entity_type: null, entity_slug: null })
    expect(entityFromPath('/outfits')).toEqual({ entity_type: null, entity_slug: null })
    expect(entityFromPath('/')).toEqual({ entity_type: null, entity_slug: null })
  })

  it('returns no entity for known non-entity subpages', () => {
    expect(entityFromPath('/eureka/sets')).toEqual({ entity_type: null, entity_slug: null })
    expect(entityFromPath('/eureka/trials')).toEqual({ entity_type: null, entity_slug: null })
    expect(entityFromPath('/outfits/seasons')).toEqual({ entity_type: null, entity_slug: null })
    expect(entityFromPath('/looks/new')).toEqual({ entity_type: null, entity_slug: null })
  })

  it('returns no entity for unrelated routes', () => {
    expect(entityFromPath('/help')).toEqual({ entity_type: null, entity_slug: null })
    expect(entityFromPath('/settings')).toEqual({ entity_type: null, entity_slug: null })
    expect(entityFromPath('/admin/eureka/sets')).toEqual({ entity_type: null, entity_slug: null })
  })

  it('ignores trailing slashes and query strings', () => {
    expect(entityFromPath('/eureka/blossoming_dream/')).toEqual({
      entity_type: 'eureka',
      entity_slug: 'blossoming_dream',
    })
  })

  it('does not treat an edit route as an entity page', () => {
    expect(entityFromPath('/looks/edit/my_look')).toEqual({
      entity_type: null,
      entity_slug: null,
    })
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `yarn test entity-from-path`
Expected: FAIL — cannot resolve `@/lib/feedback/entity-from-path`.

- [ ] **Step 4: Implement `lib/feedback/entity-from-path.ts`**

```ts
// Derives the reported-about entity from the URL alone, so the footer report
// link needs no per-page wiring. Unknown shapes yield nulls, which is valid —
// a report without an entity is still a useful report.

// Single-segment detail routes: /<domain>/<slug>
const DETAIL_DOMAINS = ['eureka', 'outfits', 'makeup', 'momo-cloaks', 'looks'] as const

// Nested detail routes: /<domain>/<section>/<slug>, reported as "domain-section"
const NESTED_DETAILS: Record<string, readonly string[]> = {
  eureka: ['trials'],
  outfits: ['seasons'],
}

// Second segments that are pages in their own right, not entity slugs.
const NON_ENTITY_SEGMENTS = new Set(['sets', 'trials', 'seasons', 'new', 'edit'])

export function entityFromPath(pathname: string): {
  entity_type: string | null
  entity_slug: string | null
} {
  const none = { entity_type: null, entity_slug: null }

  const segments = pathname.split('?')[0].split('/').filter(Boolean)
  if (segments.length < 2) return none

  const [domain, second, third] = segments

  // Admin routes are never the subject of a user-facing report.
  if (domain === 'admin') return none

  const nested = NESTED_DETAILS[domain]
  if (nested?.includes(second)) {
    return third ? { entity_type: `${domain}-${second}`, entity_slug: third } : none
  }

  if (!(DETAIL_DOMAINS as readonly string[]).includes(domain)) return none
  if (NON_ENTITY_SEGMENTS.has(second)) return none
  if (segments.length > 2) return none

  return { entity_type: domain, entity_slug: second }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `yarn test entity-from-path`
Expected: PASS, all 8 cases.

- [ ] **Step 6: Type-check**

Run: `yarn tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/types/feedback.ts lib/feedback/entity-from-path.ts lib/feedback/__tests__/entity-from-path.test.ts
git commit -m "feat(feedback): add domain types and pathname entity parser"
```

---

### Task 4: Submission validation

**Files:**

- Create: `lib/feedback/validate.ts`, `lib/feedback/__tests__/validate.test.ts`

**Interfaces:**

- Consumes: constants and `FeedbackType` from `lib/types/feedback.ts` (Task 3).
- Produces:
  - `interface SubmissionInput { type: string; category: string; title: string; description: string; email?: string | null }`
  - `type ValidationResult = { ok: true; value: ValidatedSubmission } | { ok: false; errors: Record<string, string> }`
  - `interface ValidatedSubmission { type: FeedbackType; category: string; title: string; description: string; email: string | null }`
  - `validateSubmission(input: SubmissionInput): ValidationResult`

- [ ] **Step 1: Write the failing test at `lib/feedback/__tests__/validate.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { validateSubmission } from '@/lib/feedback/validate'

const valid = {
  type: 'issue',
  category: 'Bug report',
  title: 'Image fails to load',
  description: 'The thumbnail is blank on this set.',
}

describe('validateSubmission', () => {
  it('accepts a valid submission and trims whitespace', () => {
    const result = validateSubmission({ ...valid, title: '  Image fails to load  ' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.title).toBe('Image fails to load')
      expect(result.value.type).toBe('issue')
      expect(result.value.email).toBeNull()
    }
  })

  it('rejects an unknown type', () => {
    const result = validateSubmission({ ...valid, type: 'spam' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.type).toBeDefined()
  })

  it('rejects a category that does not belong to the type', () => {
    // 'New feature' is a feature category, not an issue category.
    const result = validateSubmission({ ...valid, type: 'issue', category: 'New feature' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.category).toBeDefined()
  })

  it('accepts a category that does belong to the type', () => {
    const result = validateSubmission({
      ...valid,
      type: 'feature',
      category: 'New feature',
    })
    expect(result.ok).toBe(true)
  })

  it('rejects an empty or whitespace-only title', () => {
    expect(validateSubmission({ ...valid, title: '' }).ok).toBe(false)
    expect(validateSubmission({ ...valid, title: '   ' }).ok).toBe(false)
  })

  it('rejects an empty description', () => {
    expect(validateSubmission({ ...valid, description: '' }).ok).toBe(false)
  })

  it('rejects an over-long title', () => {
    const result = validateSubmission({ ...valid, title: 'x'.repeat(201) })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.title).toBeDefined()
  })

  it('rejects an over-long description', () => {
    const result = validateSubmission({ ...valid, description: 'x'.repeat(5001) })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.description).toBeDefined()
  })

  it('accepts a valid email and normalizes case', () => {
    const result = validateSubmission({ ...valid, email: '  User@Example.COM ' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.email).toBe('user@example.com')
  })

  it('rejects a malformed email', () => {
    const result = validateSubmission({ ...valid, email: 'not-an-email' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.email).toBeDefined()
  })

  it('treats an empty email string as absent', () => {
    const result = validateSubmission({ ...valid, email: '   ' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.email).toBeNull()
  })

  it('reports every failing field at once', () => {
    const result = validateSubmission({
      type: 'issue',
      category: 'Bug report',
      title: '',
      description: '',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(['description', 'title'])
    }
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test validate`
Expected: FAIL — cannot resolve `@/lib/feedback/validate`.

- [ ] **Step 3: Implement `lib/feedback/validate.ts`**

```ts
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
  categoriesFor,
  type FeedbackType,
} from '@/lib/types/feedback'

export interface SubmissionInput {
  type: string
  category: string
  title: string
  description: string
  email?: string | null
}

export interface ValidatedSubmission {
  type: FeedbackType
  category: string
  title: string
  description: string
  email: string | null
}

export type ValidationResult =
  | { ok: true; value: ValidatedSubmission }
  | { ok: false; errors: Record<string, string> }

// Deliberately permissive: catches typos, not RFC violations. The address is
// never trusted for anything beyond an optional receipt.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isFeedbackType(value: string): value is FeedbackType {
  return value === 'feature' || value === 'issue'
}

// Shared by the route and the form so both agree on what is acceptable —
// the client gets inline errors, the server enforces them.
export function validateSubmission(input: SubmissionInput): ValidationResult {
  const errors: Record<string, string> = {}

  const title = (input.title ?? '').trim()
  const description = (input.description ?? '').trim()
  const email = (input.email ?? '').trim()

  if (!isFeedbackType(input.type)) {
    errors.type = 'Unknown feedback type.'
  } else if (!categoriesFor(input.type).includes(input.category)) {
    errors.category = 'Choose a category from the list.'
  }

  if (!title) {
    errors.title = 'Please add a title.'
  } else if (title.length > MAX_TITLE_LENGTH) {
    errors.title = `Keep the title under ${MAX_TITLE_LENGTH} characters.`
  }

  if (!description) {
    errors.description = 'Please describe what happened.'
  } else if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `Keep the description under ${MAX_DESCRIPTION_LENGTH} characters.`
  }

  if (email && !EMAIL_PATTERN.test(email)) {
    errors.email = 'That email address does not look right.'
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  return {
    ok: true,
    value: {
      type: input.type as FeedbackType,
      category: input.category,
      title,
      description,
      email: email ? email.toLowerCase() : null,
    },
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test validate`
Expected: PASS, all 12 cases.

- [ ] **Step 5: Type-check and commit**

Run: `yarn tsc --noEmit` (expect no errors), then:

```bash
git add lib/feedback/validate.ts lib/feedback/__tests__/validate.test.ts
git commit -m "feat(feedback): add shared submission validation"
```

---

### Task 5: Rate limiting and image processing

**Files:**

- Create: `lib/feedback/rate-limit.ts`, `lib/feedback/images.ts`, `lib/feedback/__tests__/rate-limit.test.ts`
- Modify: `package.json` (add `sharp`)
- Do NOT modify: `.env.example` / `.env.local` — blocked by a PreToolUse hook; the user adds these
  (see Step 2)

**Interfaces:**

- Consumes: nothing from earlier tasks.
- Produces:
  - `hashIp(ip: string): string`
  - `currentWindowStart(now?: Date): Date`
  - `checkRateLimit(client: SupabaseClient, ip: string): Promise<{ allowed: boolean }>`
  - `processImages(files: File[]): Promise<{ buffer: Buffer; name: string }[]>`
  - `RATE_LIMIT_PER_HOUR = 5`

- [ ] **Step 1: Install `sharp`**

```bash
yarn add sharp
```

- [ ] **Step 2: Surface the salt env var for the user to add — do NOT edit any env file**

**Do not attempt to create or edit `.env.example` or `.env.local`.** A PreToolUse hook in
`.claude/settings.json` blocks Edit/Write on any path containing `.env` — including
`.env.example` — and routing around it with Bash is not acceptable. This step is documentation
only; the user adds both lines themselves.

In your task report, surface these two items verbatim for the user:

1. The line to add to `.env.example`:

```env
FEEDBACK_IP_SALT=            # server-only; salts hashed IPs in feedback_rate_limit
```

2. The command to generate a real value in `.env.local`:

```bash
echo "FEEDBACK_IP_SALT=$(openssl rand -hex 32)" >> .env.local
```

The tests in this task stub the variable with `vi.stubEnv`, so they pass without it being set.
`hashIp` falls back to an empty salt when the variable is absent, so the route still functions —
it is just less resistant to a precomputed-hash attack until the user adds the real value. Note
this in your report as a follow-up the user must complete before deploying.

- [ ] **Step 3: Write the failing test at `lib/feedback/__tests__/rate-limit.test.ts`**

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { currentWindowStart, hashIp } from '@/lib/feedback/rate-limit'

describe('hashIp', () => {
  beforeEach(() => {
    vi.stubEnv('FEEDBACK_IP_SALT', 'test-salt')
  })

  it('is deterministic for the same address', () => {
    expect(hashIp('203.0.113.5')).toBe(hashIp('203.0.113.5'))
  })

  it('differs between addresses', () => {
    expect(hashIp('203.0.113.5')).not.toBe(hashIp('203.0.113.6'))
  })

  it('never returns the raw address', () => {
    expect(hashIp('203.0.113.5')).not.toContain('203.0.113.5')
  })

  it('produces a hex digest', () => {
    expect(hashIp('203.0.113.5')).toMatch(/^[a-f0-9]{64}$/)
  })
})

describe('currentWindowStart', () => {
  it('truncates to the top of the hour', () => {
    const result = currentWindowStart(new Date('2026-08-11T14:37:22.500Z'))
    expect(result.toISOString()).toBe('2026-08-11T14:00:00.000Z')
  })

  it('gives the same window for two times in the same hour', () => {
    const a = currentWindowStart(new Date('2026-08-11T14:01:00Z'))
    const b = currentWindowStart(new Date('2026-08-11T14:59:59Z'))
    expect(a.getTime()).toBe(b.getTime())
  })

  it('gives different windows across an hour boundary', () => {
    const a = currentWindowStart(new Date('2026-08-11T14:59:59Z'))
    const b = currentWindowStart(new Date('2026-08-11T15:00:00Z'))
    expect(a.getTime()).not.toBe(b.getTime())
  })
})
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `yarn test rate-limit`
Expected: FAIL — cannot resolve `@/lib/feedback/rate-limit`.

- [ ] **Step 5: Implement `lib/feedback/rate-limit.ts`**

```ts
import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export const RATE_LIMIT_PER_HOUR = 5

// Salted digest so the table never accumulates a log of raw visitor IPs.
export function hashIp(ip: string): string {
  const salt = process.env.FEEDBACK_IP_SALT ?? ''
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex')
}

// Fixed hourly windows keyed by the top of the hour, so the counter is a
// simple upsert rather than a sliding-window scan.
export function currentWindowStart(now: Date = new Date()): Date {
  const start = new Date(now)
  start.setUTCMinutes(0, 0, 0)
  return start
}

// Returns whether this request is allowed and records it if so.
// Fails OPEN on a database error: a broken counter should not take the
// feedback form offline, and the abuse ceiling is bounded by the size caps.
export async function checkRateLimit(
  client: SupabaseClient,
  ip: string
): Promise<{ allowed: boolean }> {
  const ip_hash = hashIp(ip)
  const window_start = currentWindowStart().toISOString()

  const { data, error } = await client
    .from('feedback_rate_limit')
    .select('count')
    .eq('ip_hash', ip_hash)
    .eq('window_start', window_start)
    .maybeSingle()

  if (error) {
    console.error('Rate limit read failed, allowing request:', error)
    return { allowed: true }
  }

  const used = data?.count ?? 0
  if (used >= RATE_LIMIT_PER_HOUR) return { allowed: false }

  const { error: writeError } = await client
    .from('feedback_rate_limit')
    .upsert({ ip_hash, window_start, count: used + 1 }, { onConflict: 'ip_hash,window_start' })

  if (writeError) {
    console.error('Rate limit write failed, allowing request:', writeError)
  }

  return { allowed: true }
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `yarn test rate-limit`
Expected: PASS, all 7 cases.

- [ ] **Step 7: Implement `lib/feedback/images.ts`**

```ts
import sharp from 'sharp'
import { MAX_IMAGE_BYTES, MAX_IMAGES } from '@/lib/types/feedback'

const MAX_DIMENSION = 2000

export interface ProcessedImage {
  buffer: Buffer
  name: string
}

// Re-encodes every upload server-side. This does three jobs at once:
// normalizes to WebP (matching the rest of the app's storage), strips EXIF —
// phone screenshots routinely carry GPS — and neutralizes a malicious payload
// disguised as an image, since the output is freshly encoded rather than the
// bytes we were handed.
//
// Anything that fails to decode is skipped rather than throwing: one bad file
// should not cost the user their whole report.
export async function processImages(files: File[]): Promise<ProcessedImage[]> {
  const accepted = files.filter((f) => f.size > 0 && f.size <= MAX_IMAGE_BYTES).slice(0, MAX_IMAGES)

  const results: ProcessedImage[] = []

  for (const [index, file] of accepted.entries()) {
    try {
      const input = Buffer.from(await file.arrayBuffer())
      const buffer = await sharp(input)
        .rotate() // apply EXIF orientation before the metadata is dropped
        .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer()

      results.push({ buffer, name: `${index}.webp` })
    } catch (error) {
      console.error(`Skipping unprocessable upload "${file.name}":`, error)
    }
  }

  return results
}
```

- [ ] **Step 8: Type-check**

Run: `yarn tsc --noEmit`
Expected: no errors. If `sharp` types are missing, confirm it installed with `yarn why sharp`.

- [ ] **Step 9: Commit**

```bash
git add package.json yarn.lock lib/feedback/rate-limit.ts lib/feedback/images.ts lib/feedback/__tests__/rate-limit.test.ts
git commit -m "feat(feedback): add IP rate limiting and sharp image processing"
```

---

### Task 6: The submission API route

**Files:**

- Create: `app/api/feedback/route.ts`

**Interfaces:**

- Consumes: `validateSubmission` (Task 4), `checkRateLimit` / `processImages` (Task 5), `ReportContext` (Task 3).
- Produces: `POST /api/feedback` accepting `multipart/form-data`. Response on success:
  `{ feedback: { id, type, category, title, description, page_path, entity_type, entity_slug, entity_title, created_at }, imageNames: string[], imagesFailed: boolean }` with status `201`.
  Errors: `400 { errors: Record<string,string> }`, `429 { error: string }`, `500 { error: string }`.

- [ ] **Step 1: Implement `app/api/feedback/route.ts`**

```ts
import { NextResponse, connection } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { validateSubmission } from '@/lib/feedback/validate'
import { checkRateLimit } from '@/lib/feedback/rate-limit'
import { processImages } from '@/lib/feedback/images'
import { MAX_IMAGES } from '@/lib/types/feedback'

// Service-role client: the only writer to feedback tables. RLS grants no
// client role INSERT, so every submission — anonymous or authenticated —
// funnels through this one validated, rate-limited path.
function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  // Left-most entry is the original client; the rest are proxies.
  return forwarded?.split(',')[0]?.trim() || 'unknown'
}

function str(form: FormData, key: string): string {
  const value = form.get(key)
  return typeof value === 'string' ? value : ''
}

function nullableStr(form: FormData, key: string): string | null {
  const value = str(form, key).trim()
  return value === '' ? null : value
}

export async function POST(request: Request) {
  // Reads auth cookies below. Deferred to request time so PPR does not
  // prerender this route. Outside the try/catch so the prerender-abort signal
  // propagates to React rather than being swallowed as a 500.
  await connection()

  try {
    const service = serviceClient()

    const { allowed } = await checkRateLimit(service, clientIp(request))
    if (!allowed) {
      return NextResponse.json(
        { error: 'You have sent several reports recently. Please try again later.' },
        { status: 429 }
      )
    }

    const form = await request.formData()

    const result = validateSubmission({
      type: str(form, 'type'),
      category: str(form, 'category'),
      title: str(form, 'title'),
      description: str(form, 'description'),
      email: str(form, 'email'),
    })

    if (!result.ok) {
      return NextResponse.json({ errors: result.errors }, { status: 400 })
    }

    // Logged-in users are identified from their session cookie, never from a
    // client-supplied id.
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const email = result.value.email ?? user?.email ?? null

    const { data: row, error: insertError } = await service
      .from('feedback')
      .insert({
        ...result.value,
        email,
        user_id: user?.id ?? null,
        page_path: nullableStr(form, 'page_path'),
        entity_type: nullableStr(form, 'entity_type'),
        entity_slug: nullableStr(form, 'entity_slug'),
        entity_title: nullableStr(form, 'entity_title'),
        user_agent: request.headers.get('user-agent'),
      })
      .select(
        'id, type, category, title, description, page_path, entity_type, entity_slug, entity_title, created_at'
      )
      .single()

    if (insertError || !row) throw insertError ?? new Error('Insert returned no row')

    // Partial-failure rule: the row is already committed and is never rolled
    // back for an image problem. A report that arrives without its screenshot
    // beats a report lost to a failed upload.
    const files = form.getAll('images').filter((f): f is File => f instanceof File)
    let imagesFailed = false
    const imageNames: string[] = []

    if (files.length > 0) {
      try {
        const processed = await processImages(files.slice(0, MAX_IMAGES))

        for (const image of processed) {
          const path = `${row.id}/${image.name}`
          const { error: uploadError } = await service.storage
            .from('feedback')
            .upload(path, image.buffer, { contentType: 'image/webp', upsert: true })

          if (uploadError) throw uploadError

          const { error: rowError } = await service
            .from('feedback_images')
            .insert({ feedback_id: row.id, path })

          if (rowError) throw rowError

          imageNames.push(image.name)
        }

        if (processed.length < files.length) imagesFailed = true
      } catch (error) {
        console.error(`Attachment handling failed for feedback ${row.id}:`, error)
        imagesFailed = true
      }
    }

    return NextResponse.json({ feedback: row, imageNames, imagesFailed }, { status: 201 })
  } catch (error) {
    console.error('Failed to submit feedback:', error)
    return NextResponse.json(
      { error: 'Something went wrong sending your report. Please try again.' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Type-check**

Run: `yarn tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Start the dev server and submit a minimal report**

Run: `yarn dev`

In a second terminal:

```bash
curl -i -X POST http://localhost:3000/api/feedback \
  -F 'type=issue' -F 'category=Bug report' \
  -F 'title=Route smoke test' -F 'description=Testing the endpoint.'
```

Expected: `HTTP/1.1 201` and a JSON body containing a `feedback.id`.

- [ ] **Step 4: Verify validation rejects bad input**

```bash
curl -i -X POST http://localhost:3000/api/feedback \
  -F 'type=issue' -F 'category=Bug report' -F 'title=' -F 'description='
```

Expected: `HTTP/1.1 400` with `{"errors":{"title":"...","description":"..."}}`.

- [ ] **Step 5: Verify an image round-trips**

```bash
curl -i -X POST http://localhost:3000/api/feedback \
  -F 'type=issue' -F 'category=Bug report' \
  -F 'title=Image smoke test' -F 'description=With a screenshot.' \
  -F 'images=@/path/to/any.png'
```

Expected: `201`, and `imageNames` contains `0.webp`. Confirm in the Supabase dashboard that the object exists under `feedback/<id>/0.webp` and that a `feedback_images` row points at it.

- [ ] **Step 6: Verify the rate limit trips**

Run the Step 3 curl **six times in a row**.
Expected: the first five return `201`; the sixth returns `429`.

Then reset for later tasks:

```sql
delete from public.feedback_rate_limit;
```

- [ ] **Step 7: Clean up the smoke-test rows**

```sql
delete from public.feedback where title in ('Route smoke test', 'Image smoke test');
```

Note: this cascades `feedback_images` rows but leaves storage objects behind. Delete `feedback/<id>/` objects in the dashboard, or leave them — they are cleaned up as part of Task 8's admin delete path.

- [ ] **Step 8: Commit**

```bash
git add app/api/feedback/route.ts
git commit -m "feat(feedback): add rate-limited submission API route"
```

---

### Task 7: Shared form, receipt, and help page rewire

**Files:**

- Create: `components/feedback/image-picker.tsx`, `components/feedback/feedback-receipt.tsx`, `components/feedback/feedback-form.tsx`, `components/feedback/__tests__/feedback-form.test.tsx`
- Modify: `app/help/help-actions.tsx`
- Delete: `app/help/bug-report-form.tsx`, `app/help/feature-request-form.tsx`

**Interfaces:**

- Consumes: types and constants (Task 3), `validateSubmission` (Task 4), `POST /api/feedback` (Task 6).
- Produces:
  - `<FeedbackForm type={FeedbackType} context?={ReportContext} onClose={() => void} />` — resolves
    the signed-in state internally via `@/lib/supabase/client`; callers pass no auth prop.
  - `<FeedbackReceipt submission={ReceiptData} imageNames={string[]} imagesFailed={boolean} onClose={() => void} />`
  - `interface ReceiptData { type: string; category: string; title: string; description: string; page_path: string | null; entity_title: string | null; entity_slug: string | null }`

- [ ] **Step 1: Create `components/feedback/image-picker.tsx`**

```tsx
'use client'

import AttachFileIcon from '@mui/icons-material/AttachFile'
import CloseIcon from '@mui/icons-material/Close'
import { Box, Button, IconButton, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { MAX_IMAGES, MAX_IMAGE_BYTES } from '@/lib/types/feedback'

interface ImagePickerProps {
  files: File[]
  onChange: (files: File[]) => void
  disabled?: boolean
}

export default function ImagePicker({ files, onChange, disabled }: ImagePickerProps) {
  const [previews, setPreviews] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Object URLs must be revoked or the blobs leak for the page's lifetime.
  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file))
    setPreviews(urls)
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [files])

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (picked.length === 0) return

    const tooLarge = picked.filter((f) => f.size > MAX_IMAGE_BYTES)
    const room = MAX_IMAGES - files.length
    const accepted = picked.filter((f) => f.size <= MAX_IMAGE_BYTES).slice(0, room)

    if (tooLarge.length > 0) {
      setError(`Each image must be under ${MAX_IMAGE_BYTES / 1024 / 1024}MB.`)
    } else if (picked.length > room) {
      setError(`You can attach up to ${MAX_IMAGES} images.`)
    } else {
      setError(null)
    }

    if (accepted.length > 0) onChange([...files, ...accepted])
  }

  return (
    <Box>
      <Button
        component="label"
        disabled={disabled || files.length >= MAX_IMAGES}
        size="small"
        startIcon={<AttachFileIcon />}
        variant="outlined"
      >
        Add screenshots
        <input hidden multiple accept="image/*" type="file" onChange={handleChange} />
      </Button>

      {previews.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          {previews.map((src, index) => (
            <Box key={files[index]?.name ?? index} sx={{ position: 'relative' }}>
              {/* Local object URL, not a remote asset — next/image adds nothing here. */}
              <Box
                alt=""
                component="img"
                src={src}
                sx={{
                  width: 72,
                  height: 72,
                  objectFit: 'cover',
                  borderRadius: 1,
                  display: 'block',
                }}
              />
              <IconButton
                aria-label={`Remove ${files[index]?.name ?? 'image'}`}
                disabled={disabled}
                size="small"
                sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'background.paper' },
                }}
                onClick={() => onChange(files.filter((_, i) => i !== index))}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      <Typography
        color={error ? 'error' : 'text.secondary'}
        sx={{ display: 'block', mt: 0.5 }}
        variant="caption"
      >
        {error ?? `Optional. Up to ${MAX_IMAGES} images, ${MAX_IMAGE_BYTES / 1024 / 1024}MB each.`}
      </Typography>
    </Box>
  )
}
```

- [ ] **Step 2: Create `components/feedback/feedback-receipt.tsx`**

```tsx
'use client'

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { Alert, Box, Button, DialogActions, Divider, Stack, Typography } from '@mui/material'

export interface ReceiptData {
  type: string
  category: string
  title: string
  description: string
  page_path: string | null
  entity_title: string | null
  entity_slug: string | null
}

interface FeedbackReceiptProps {
  submission: ReceiptData
  imageNames: string[]
  imagesFailed: boolean
  onClose: () => void
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography color="text.secondary" variant="overline">
        {label}
      </Typography>
      <Typography sx={{ whiteSpace: 'pre-wrap' }} variant="body2">
        {value}
      </Typography>
    </Box>
  )
}

// The in-app receipt is the primary confirmation: it needs no email address
// and no delivery, so an anonymous submitter still leaves with a record of
// exactly what they sent.
export default function FeedbackReceipt({
  submission,
  imageNames,
  imagesFailed,
  onClose,
}: FeedbackReceiptProps) {
  const subject = submission.entity_title ?? submission.entity_slug

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
        <CheckCircleOutlineIcon color="success" />
        <Typography variant="h6">Thanks — we got it</Typography>
      </Stack>

      <Typography color="text.secondary" sx={{ mb: 2 }} variant="body2">
        Here is a copy of what you sent. There may not be an individual reply, but every report is
        read.
      </Typography>

      {imagesFailed && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Your report was received, but at least one screenshot could not be attached.
        </Alert>
      )}

      <Divider sx={{ mb: 2 }} />

      <Stack spacing={1.5}>
        <Field label="Category" value={submission.category} />
        <Field label="Title" value={submission.title} />
        <Field label="Description" value={submission.description} />
        {subject && <Field label="About" value={subject} />}
        {submission.page_path && <Field label="Page" value={submission.page_path} />}
        {imageNames.length > 0 && (
          <Field
            label={imageNames.length === 1 ? 'Screenshot' : 'Screenshots'}
            value={imageNames.join(', ')}
          />
        )}
      </Stack>

      <DialogActions sx={{ px: 0, pb: 0, pt: 2 }}>
        <Button variant="contained" onClick={onClose}>
          Done
        </Button>
      </DialogActions>
    </Box>
  )
}
```

- [ ] **Step 3: Create `components/feedback/feedback-form.tsx`**

```tsx
'use client'

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  DialogActions,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import FeedbackReceipt, { type ReceiptData } from './feedback-receipt'
import ImagePicker from './image-picker'
import { createClient } from '@/lib/supabase/client'
import { validateSubmission } from '@/lib/feedback/validate'
import {
  MAX_DESCRIPTION_LENGTH,
  categoriesFor,
  type FeedbackType,
  type ReportContext,
} from '@/lib/types/feedback'

interface FeedbackFormProps {
  type: FeedbackType
  context?: ReportContext
  onClose: () => void
}

interface Success {
  submission: ReceiptData
  imageNames: string[]
  imagesFailed: boolean
}

export default function FeedbackForm({ type, context, onClose }: FeedbackFormProps) {
  const categories = categoriesFor(type)
  const [category, setCategory] = useState(categories[0])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState<Success | null>(null)

  // Resolved here rather than passed in: the two call sites (the help page and
  // the global footer link) are both auth-unaware client components, so a prop
  // would have to be threaded through unrelated trees. `null` means "not yet
  // known" and keeps the email field hidden until the answer arrives, so it
  // never flashes in for a logged-in user.
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (active) setIsLoggedIn(Boolean(data.user))
    })
    return () => {
      active = false
    }
  }, [])

  const subject = context?.entity_title ?? context?.entity_slug

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitError(null)

    // Same validator the server runs, so inline errors match what would be
    // rejected rather than approximating it.
    const result = validateSubmission({ type, category, title, description, email })
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors({})

    const body = new FormData()
    body.set('type', type)
    body.set('category', category)
    body.set('title', title)
    body.set('description', description)
    body.set('email', email)
    if (context) {
      body.set('page_path', context.page_path)
      if (context.entity_type) body.set('entity_type', context.entity_type)
      if (context.entity_slug) body.set('entity_slug', context.entity_slug)
      if (context.entity_title) body.set('entity_title', context.entity_title)
    }
    images.forEach((file) => body.append('images', file))

    setPending(true)
    try {
      const response = await fetch('/api/feedback', { method: 'POST', body })
      const payload = await response.json()

      if (!response.ok) {
        if (response.status === 400 && payload.errors) {
          setErrors(payload.errors)
        } else {
          setSubmitError(payload.error ?? 'Something went wrong. Please try again.')
        }
        return
      }

      setSuccess({
        submission: payload.feedback,
        imageNames: payload.imageNames ?? [],
        imagesFailed: Boolean(payload.imagesFailed),
      })
    } catch {
      setSubmitError('Could not reach the server. Please check your connection and try again.')
    } finally {
      setPending(false)
    }
  }

  if (success) {
    return (
      <FeedbackReceipt
        imageNames={success.imageNames}
        imagesFailed={success.imagesFailed}
        submission={success.submission}
        onClose={onClose}
      />
    )
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <Stack spacing={2} sx={{ pt: 1 }}>
        {submitError && (
          <Alert severity="error" onClose={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        )}

        {/* Captured context is shown, never hidden — people should know what
            they are sending along with their words. */}
        {context && (
          <Box>
            <Typography color="text.secondary" variant="caption">
              Reporting about
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip label={subject ?? context.page_path} size="small" />
            </Box>
          </Box>
        )}

        <FormControl fullWidth required error={Boolean(errors.category)}>
          <InputLabel id="feedback-category-label">Category</InputLabel>
          <Select
            label="Category"
            labelId="feedback-category-label"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          required
          error={Boolean(errors.title)}
          helperText={errors.title}
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <TextField
          fullWidth
          multiline
          required
          error={Boolean(errors.description)}
          helperText={
            errors.description ?? `${description.length}/${MAX_DESCRIPTION_LENGTH} characters`
          }
          label={type === 'feature' ? 'What would you like to see?' : 'What went wrong?'}
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />

        {/* Logged-in users already have an address on file, so asking again is
            noise. Anonymous users are told what the field is for. Hidden while
            auth is still resolving (null) to avoid a flash. */}
        {isLoggedIn === false && (
          <TextField
            fullWidth
            error={Boolean(errors.email)}
            helperText={errors.email ?? "Optional — we'll send you a copy."}
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        )}

        <ImagePicker disabled={pending} files={images} onChange={setImages} />
      </Stack>

      <DialogActions sx={{ px: 0, pb: 0, pt: 2 }}>
        <Button disabled={pending} onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={pending}
          startIcon={pending ? <CircularProgress size={16} /> : null}
          type="submit"
          variant="contained"
        >
          {pending ? 'Sending…' : 'Send'}
        </Button>
      </DialogActions>
    </form>
  )
}
```

- [ ] **Step 4: Write the failing test at `components/feedback/__tests__/feedback-form.test.tsx`**

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import FeedbackForm from '@/components/feedback/feedback-form'

function fetchOk(body: unknown, status = 201) {
  return vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    json: async () => body,
  })
}

const receipt = {
  feedback: {
    type: 'issue',
    category: 'Bug report',
    title: 'Broken image',
    description: 'The thumbnail is blank.',
    page_path: null,
    entity_title: null,
    entity_slug: null,
  },
  imageNames: [],
  imagesFailed: false,
}

// The form resolves auth itself, so the browser client is mocked. `mockUser`
// is reassigned per test to switch between anonymous and signed-in.
let mockUser: { id: string } | null = null

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: mockUser }, error: null }) },
  }),
}))

describe('FeedbackForm', () => {
  beforeEach(() => {
    mockUser = null
    vi.stubGlobal('fetch', fetchOk(receipt))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the issue categories for type=issue', async () => {
    render(<FeedbackForm type="issue" onClose={() => {}} />)
    expect(screen.getByLabelText(/category/i)).toHaveTextContent('Bug report')
  })

  it('shows the feature categories for type=feature', async () => {
    render(<FeedbackForm type="feature" onClose={() => {}} />)
    expect(screen.getByLabelText(/category/i)).toHaveTextContent('New feature')
  })

  it('blocks submission and shows inline errors when required fields are empty', async () => {
    const user = userEvent.setup()
    render(<FeedbackForm type="issue" onClose={() => {}} />)

    await user.click(screen.getByRole('button', { name: /send/i }))

    expect(await screen.findByText(/please add a title/i)).toBeInTheDocument()
    expect(screen.getByText(/please describe what happened/i)).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('submits and renders the receipt on success', async () => {
    const user = userEvent.setup()
    render(<FeedbackForm type="issue" onClose={() => {}} />)

    await user.type(screen.getByLabelText(/title/i), 'Broken image')
    await user.type(screen.getByLabelText(/what went wrong/i), 'The thumbnail is blank.')
    await user.click(screen.getByRole('button', { name: /send/i }))

    expect(await screen.findByText(/thanks — we got it/i)).toBeInTheDocument()
    expect(screen.getByText('Broken image')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('surfaces a server error and stays on the form', async () => {
    vi.stubGlobal('fetch', fetchOk({ error: 'Rate limited.' }, 429))
    const user = userEvent.setup()
    render(<FeedbackForm type="issue" onClose={() => {}} />)

    await user.type(screen.getByLabelText(/title/i), 'Broken image')
    await user.type(screen.getByLabelText(/what went wrong/i), 'The thumbnail is blank.')
    await user.click(screen.getByRole('button', { name: /send/i }))

    expect(await screen.findByText(/rate limited/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  it('hides the email field for logged-in users', async () => {
    mockUser = { id: 'user-1' }
    render(<FeedbackForm type="issue" onClose={() => {}} />)

    // Auth resolves asynchronously; wait for the anonymous case to be ruled
    // out rather than asserting on the pre-resolution render.
    await waitFor(() => expect(screen.getByLabelText(/title/i)).toBeInTheDocument())
    expect(screen.queryByLabelText(/^email$/i)).not.toBeInTheDocument()
  })

  it('shows the email field for anonymous users', async () => {
    render(<FeedbackForm type="issue" onClose={() => {}} />)
    expect(await screen.findByLabelText(/^email$/i)).toBeInTheDocument()
  })

  it('displays the captured context', () => {
    render(
      <FeedbackForm
        context={{
          page_path: '/eureka/blossoming_dream',
          entity_type: 'eureka',
          entity_slug: 'blossoming_dream',
          entity_title: 'Blossoming Dream',
        }}
        type="issue"
        onClose={() => {}}
      />
    )
    expect(screen.getByText('Reporting about')).toBeInTheDocument()
    expect(screen.getByText('Blossoming Dream')).toBeInTheDocument()
  })
})
```

- [ ] **Step 5: Run the test**

Run: `yarn test feedback-form`
Expected: PASS, all 8 cases. If the MUI `Select` label query fails, the `labelId`/`InputLabel` pairing in Step 3 is what makes `getByLabelText` work — verify it matches.

- [ ] **Step 6: Rewire `app/help/help-actions.tsx`**

Replace the two form imports:

```tsx
import BugReportForm from './bug-report-form'
import FeatureRequestForm from './feature-request-form'
```

with:

```tsx
import FeedbackForm from '@/components/feedback/feedback-form'
```

Then replace the two dialog bodies. `<FeatureRequestForm onClose={...} />` becomes:

```tsx
<FeedbackForm type="feature" onClose={() => setFeatureOpen(false)} />
```

and `<BugReportForm onClose={...} />` becomes:

```tsx
<FeedbackForm type="issue" onClose={() => setBugOpen(false)} />
```

- [ ] **Step 7: Delete the old forms**

```bash
git rm app/help/bug-report-form.tsx app/help/feature-request-form.tsx
```

- [ ] **Step 8: Verify no references remain**

Run: `grep -rn "bug-report-form\|feature-request-form\|BugReportForm\|FeatureRequestForm" --include="*.tsx" --include="*.ts" . --exclude-dir=node_modules --exclude-dir=.next`
Expected: no output.

- [ ] **Step 9: Type-check and lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: no errors.

- [ ] **Step 10: Manual verification**

Run `yarn dev`, open `http://localhost:3000/help`.

1. Click "Feature request" → categories read New feature / Improvement / Other.
2. Click Send with empty fields → inline errors appear under Title and Description; no network request.
3. Fill in a title and description, attach a screenshot → a thumbnail preview appears with a remove button.
4. Click Send → the dialog switches to the receipt showing your text and the filename `0.webp`.
5. Close, then open "Report an issue" → categories read Bug report / Missing content / Other.
6. Confirm in Supabase that both rows exist in `feedback` with the right `type`.

- [ ] **Step 11: Commit**

```bash
git add components/feedback app/help/help-actions.tsx
git commit -m "feat(feedback): add shared form with real uploads and in-app receipt"
```

---

### Task 8: Per-page report link

**Files:**

- Create: `components/feedback/report-context.tsx`, `components/feedback/report-issue-link.tsx`, `components/feedback/__tests__/report-issue-link.test.tsx`
- Modify: `components/navbar/nav-footer.tsx`

**Interfaces:**

- Consumes: `FeedbackForm` (Task 7), `entityFromPath` (Task 3).
- Produces:
  - `<ReportSubjectProvider title={string | null}>{children}</ReportSubjectProvider>`
  - `useReportSubject(): string | null`
  - `<ReportIssueLink />` — self-contained, no props.

- [ ] **Step 1: Create `components/feedback/report-context.tsx`**

```tsx
'use client'

import { createContext, useContext } from 'react'

// Optional enrichment only. The footer link derives route and slug on its own;
// a detail page that already knows the entity's display name can publish it
// here so the report reads "Blossoming Dream" instead of "blossoming_dream".
// Nothing breaks when no provider is present.
const ReportSubjectContext = createContext<string | null>(null)

export function ReportSubjectProvider({
  title,
  children,
}: {
  title: string | null
  children: React.ReactNode
}) {
  return <ReportSubjectContext.Provider value={title}>{children}</ReportSubjectContext.Provider>
}

export function useReportSubject(): string | null {
  return useContext(ReportSubjectContext)
}
```

- [ ] **Step 2: Create `components/feedback/report-issue-link.tsx`**

```tsx
'use client'

import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined'
import { Button, Dialog, DialogContent, DialogTitle } from '@mui/material'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import FeedbackForm from './feedback-form'
import { useReportSubject } from './report-context'
import { entityFromPath } from '@/lib/feedback/entity-from-path'
import type { ReportContext } from '@/lib/types/feedback'

// Lives in the global footer rather than behind a per-page prop: every page
// already renders the footer, so there are no coverage gaps now and none can
// appear as pages are added.
export default function ReportIssueLink() {
  const pathname = usePathname()
  const subject = useReportSubject()
  const [open, setOpen] = useState(false)

  const { entity_type, entity_slug } = entityFromPath(pathname)

  const context: ReportContext = {
    page_path: pathname,
    entity_type,
    entity_slug,
    entity_title: subject,
  }

  return (
    <>
      <Button
        color="inherit"
        size="small"
        startIcon={<FlagOutlinedIcon fontSize="small" />}
        sx={{ color: 'text.disabled', textTransform: 'none' }}
        onClick={() => setOpen(true)}
      >
        Report a problem
      </Button>

      <Dialog fullWidth maxWidth="sm" open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Report a problem</DialogTitle>
        <DialogContent>
          <FeedbackForm context={context} type="issue" onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
```

- [ ] **Step 3: Write the failing test at `components/feedback/__tests__/report-issue-link.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ReportIssueLink from '@/components/feedback/report-issue-link'
import { ReportSubjectProvider } from '@/components/feedback/report-context'

vi.mock('next/navigation', () => ({
  usePathname: () => '/eureka/blossoming_dream',
}))

// FeedbackForm renders inside the dialog and resolves auth on mount.
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: null }, error: null }) },
  }),
}))

describe('ReportIssueLink', () => {
  it('renders a trigger button', () => {
    render(<ReportIssueLink />)
    expect(screen.getByRole('button', { name: /report a problem/i })).toBeInTheDocument()
  })

  it('opens the dialog with the slug as the subject when no provider supplies a title', async () => {
    const user = userEvent.setup()
    render(<ReportIssueLink />)

    await user.click(screen.getByRole('button', { name: /report a problem/i }))

    expect(await screen.findByText('Reporting about')).toBeInTheDocument()
    expect(screen.getByText('blossoming_dream')).toBeInTheDocument()
  })

  it('prefers the display title published by a provider', async () => {
    const user = userEvent.setup()
    render(
      <ReportSubjectProvider title="Blossoming Dream">
        <ReportIssueLink />
      </ReportSubjectProvider>
    )

    await user.click(screen.getByRole('button', { name: /report a problem/i }))

    expect(await screen.findByText('Blossoming Dream')).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Run the test**

Run: `yarn test report-issue-link`
Expected: PASS, all 3 cases.

- [ ] **Step 5: Mount the link in `components/navbar/nav-footer.tsx`**

Add the import at the top:

```tsx
import ReportIssueLink from '@/components/feedback/report-issue-link'
```

Then add the link inside the inner `Stack`, after the `CoffeeButton`/`ThemeSwitcher` stack, so the footer row reads copyright · actions · report:

```tsx
<Stack direction="row" sx={{ gap: 0.5, alignItems: 'center' }}>
  <CoffeeButton />
  <ThemeSwitcher />
</Stack>
<ReportIssueLink />
```

- [ ] **Step 6: Type-check, lint, and run the full suite**

Run: `yarn tsc --noEmit && yarn lint && yarn test`
Expected: no errors; all tests pass.

- [ ] **Step 7: Manual verification**

Run `yarn dev`:

1. Visit `http://localhost:3000/eureka` → "Report a problem" appears in the footer. Click it; the dialog shows the page path `/eureka` and no entity chip subject beyond the path.
2. Visit an eureka detail page, e.g. `/eureka/<some-slug>` → the dialog's "Reporting about" chip shows the slug.
3. Submit from the detail page, then confirm in Supabase that the row has the correct `page_path`, `entity_type = 'eureka'`, and `entity_slug`.
4. Visit `/help` and `/settings` → the footer link is present there too (it is global).
5. Check mobile width (375px) → the footer wraps without overflowing horizontally.

- [ ] **Step 8: Commit**

```bash
git add components/feedback components/navbar/nav-footer.tsx
git commit -m "feat(feedback): add per-page report link to the global footer"
```

---

### Task 9: Admin triage

**Files:**

- Create: `hooks/data/admin/feedback.ts`, `app/admin/feedback/page.tsx`, `app/admin/feedback/feedback-view.tsx`, `app/admin/feedback/actions.ts`, `app/admin/feedback/[id]/page.tsx`
- Modify: `app/admin/admin-nav-menu.tsx`

**Interfaces:**

- Consumes: `Feedback`, `FEEDBACK_STATUSES` (Task 3); the `feedback` tables (Task 2).
- Produces: `getFeedback()`, `getFeedbackById(id)`, `getFeedbackImageUrls(id)`, `updateFeedbackRow(id, patch)`, `deleteFeedbackRow(id)`.

- [ ] **Step 1: Read the existing admin patterns before writing anything**

Run these and read the output — the new page must match these conventions, not invent its own:

```bash
cat app/admin/eureka/table-utils.tsx
cat app/admin/momo-cloaks/page.tsx
sed -n '1,60p' app/admin/admin-nav-menu.tsx
ls hooks/data/admin/
```

- [ ] **Step 2: Create `hooks/data/admin/feedback.ts`**

```ts
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Feedback } from '@/lib/types/feedback'

// React cache(), not `use cache`: these read auth cookies via createClient(),
// which `use cache` forbids.
export const getFeedback = cache(async (): Promise<Feedback[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to load feedback:', error)
    return []
  }
  return data ?? []
})

export const getFeedbackById = cache(async (id: string): Promise<Feedback | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.from('feedback').select('*').eq('id', id).maybeSingle()

  if (error) {
    console.error(`Failed to load feedback ${id}:`, error)
    return null
  }
  return data
})

// The bucket is private, so screenshots are only reachable through short-lived
// signed URLs generated per admin view.
export const getFeedbackImageUrls = cache(async (id: string): Promise<string[]> => {
  const supabase = await createClient()
  const { data: rows, error } = await supabase
    .from('feedback_images')
    .select('path')
    .eq('feedback_id', id)
    .order('path')

  if (error || !rows) {
    console.error(`Failed to load images for feedback ${id}:`, error)
    return []
  }

  const urls = await Promise.all(
    rows.map(async ({ path }) => {
      const { data } = await supabase.storage.from('feedback').createSignedUrl(path, 60 * 10)
      return data?.signedUrl ?? null
    })
  )

  return urls.filter((url): url is string => url !== null)
})
```

- [ ] **Step 3: Create `app/admin/feedback/actions.ts`**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { FeedbackStatus } from '@/lib/types/feedback'

// Mutations must NOT be wrapped in React cache() — a cached mutation silently
// no-ops when called twice with the same arguments.
export async function updateFeedbackRow(
  id: string,
  patch: { status?: FeedbackStatus; admin_notes?: string | null }
) {
  const supabase = await createClient()
  const { error } = await supabase.from('feedback').update(patch).eq('id', id)

  if (error) {
    console.error(`Failed to update feedback ${id}:`, error)
    return { error: error.message }
  }

  revalidatePath('/admin/feedback')
  return { error: null }
}

export async function deleteFeedbackRow(id: string) {
  const supabase = await createClient()

  // Deleting the row cascades feedback_images, but storage objects are not
  // covered by the FK — remove them explicitly or they orphan in the bucket.
  const { data: images } = await supabase
    .from('feedback_images')
    .select('path')
    .eq('feedback_id', id)

  if (images && images.length > 0) {
    const { error: storageError } = await supabase.storage
      .from('feedback')
      .remove(images.map((image) => image.path))
    if (storageError) console.error(`Failed to remove screenshots for ${id}:`, storageError)
  }

  const { error } = await supabase.from('feedback').delete().eq('id', id)
  if (error) {
    console.error(`Failed to delete feedback ${id}:`, error)
    return { error: error.message }
  }

  revalidatePath('/admin/feedback')
  return { error: null }
}
```

- [ ] **Step 4: Create `app/admin/feedback/feedback-view.tsx`**

```tsx
'use client'

import { Box, Chip } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { enqueueSnackbar } from 'notistack'
import { updateFeedbackRow } from './actions'
import { FEEDBACK_STATUSES, type Feedback, type FeedbackStatus } from '@/lib/types/feedback'

const STATUS_COLOR: Record<FeedbackStatus, 'default' | 'info' | 'success' | 'warning'> = {
  new: 'info',
  in_progress: 'warning',
  resolved: 'success',
  declined: 'default',
}

export default function FeedbackView({ rows }: { rows: Feedback[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('new')

  const visible = statusFilter === 'all' ? rows : rows.filter((row) => row.status === statusFilter)

  const columns: GridColDef<Feedback>[] = [
    {
      field: 'created_at',
      headerName: 'Received',
      width: 160,
      valueFormatter: (value: string) => new Date(value).toLocaleString(),
    },
    { field: 'type', headerName: 'Type', width: 100 },
    { field: 'category', headerName: 'Category', width: 150 },
    { field: 'title', headerName: 'Title', flex: 1, minWidth: 200 },
    { field: 'entity_slug', headerName: 'About', width: 160 },
    { field: 'page_path', headerName: 'Page', width: 180 },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      editable: true,
      type: 'singleSelect',
      valueOptions: FEEDBACK_STATUSES,
      renderCell: (params) => (
        <Chip
          color={STATUS_COLOR[params.value as FeedbackStatus]}
          label={params.value}
          size="small"
        />
      ),
    },
    { field: 'admin_notes', headerName: 'Notes', width: 220, editable: true },
  ]

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        {(['new', 'in_progress', 'resolved', 'declined', 'all'] as const).map((option) => (
          <Chip
            key={option}
            color={statusFilter === option ? 'primary' : 'default'}
            label={option}
            onClick={() => setStatusFilter(option)}
          />
        ))}
      </Box>

      <DataGrid
        disableRowSelectionOnClick
        columns={columns}
        initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
        rows={visible}
        onRowDoubleClick={(params) => router.push(`/admin/feedback/${params.id}`)}
        processRowUpdate={(updated: Feedback, original: Feedback) => {
          startTransition(async () => {
            const result = await updateFeedbackRow(updated.id, {
              status: updated.status as FeedbackStatus,
              admin_notes: updated.admin_notes,
            })
            if (result.error) {
              enqueueSnackbar('Could not save that change.', { variant: 'error' })
            }
          })
          return updated
        }}
        onProcessRowUpdateError={(error) => {
          console.error('Row update failed:', error)
          enqueueSnackbar('Could not save that change.', { variant: 'error' })
        }}
      />
    </Box>
  )
}
```

- [ ] **Step 5: Create `app/admin/feedback/page.tsx`**

```tsx
import { Suspense } from 'react'
import { Skeleton, Stack, Typography } from '@mui/material'
import FeedbackView from './feedback-view'
import { getFeedback } from '@/hooks/data/admin/feedback'

export const metadata = { title: 'Feedback' }

export default function AdminFeedbackPage() {
  return (
    <Stack spacing={2}>
      <Typography variant="h5">Feedback</Typography>
      <Suspense fallback={<Skeleton height={400} variant="rounded" />}>
        <FeedbackContent />
      </Suspense>
    </Stack>
  )
}

async function FeedbackContent() {
  const rows = await getFeedback()
  return <FeedbackView rows={rows} />
}
```

- [ ] **Step 6: Create `app/admin/feedback/[id]/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Box, Chip, Divider, Skeleton, Stack, Typography } from '@mui/material'
import { getFeedbackById, getFeedbackImageUrls } from '@/hooks/data/admin/feedback'

export const metadata = { title: 'Feedback detail' }

type Props = { params: Promise<{ id: string }> }

export default function FeedbackDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<Skeleton height={400} variant="rounded" />}>
      <FeedbackDetail params={params} />
    </Suspense>
  )
}

async function FeedbackDetail({ params }: Props) {
  const { id } = await params
  const [row, imageUrls] = await Promise.all([getFeedbackById(id), getFeedbackImageUrls(id)])

  if (!row) notFound()

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Chip label={row.type} size="small" />
        <Chip label={row.category} size="small" />
        <Chip color="info" label={row.status} size="small" />
      </Stack>

      <Typography variant="h5">{row.title}</Typography>
      <Typography color="text.secondary" variant="caption">
        {new Date(row.created_at).toLocaleString()}
        {row.email ? ` · ${row.email}` : ' · no contact address'}
      </Typography>

      <Divider />

      <Typography sx={{ whiteSpace: 'pre-wrap' }}>{row.description}</Typography>

      {(row.page_path || row.entity_slug) && (
        <Box>
          <Typography color="text.secondary" variant="overline">
            Context
          </Typography>
          <Typography variant="body2">
            {row.entity_title ?? row.entity_slug ?? '—'}
            {row.page_path ? ` (${row.page_path})` : ''}
          </Typography>
        </Box>
      )}

      {row.user_agent && (
        <Box>
          <Typography color="text.secondary" variant="overline">
            User agent
          </Typography>
          <Typography sx={{ wordBreak: 'break-all' }} variant="caption">
            {row.user_agent}
          </Typography>
        </Box>
      )}

      {imageUrls.length > 0 && (
        <Box>
          <Typography color="text.secondary" variant="overline">
            Screenshots
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {imageUrls.map((url) => (
              // Signed URLs expire, so these are deliberately not optimized or
              // cached by next/image.
              <Box
                key={url}
                alt=""
                component="img"
                src={url}
                sx={{ maxWidth: 320, borderRadius: 1 }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Stack>
  )
}
```

- [ ] **Step 7: Add the nav entry to `app/admin/admin-nav-menu.tsx`**

Read the file first (Step 1 output) and add an entry matching the existing shape exactly — typically `{ title: 'Feedback', href: '/admin/feedback' }` alongside the other admin links. Follow whatever structure is already there rather than inventing a new one.

- [ ] **Step 8: Type-check, lint, and run the suite**

Run: `yarn tsc --noEmit && yarn lint && yarn test`
Expected: no errors; all tests pass.

- [ ] **Step 9: Manual verification**

Run `yarn dev` and sign in as an admin:

1. Visit `http://localhost:3000/admin/feedback` → the grid lists the rows submitted in Tasks 7 and 8, newest first, filtered to `new`.
2. Double-click a row → the detail page opens, showing description, context, user agent, and any screenshots (which must actually render — a broken image means the signed URL failed).
3. Back on the list, edit a row's `status` to `resolved` and press Enter → the chip updates; reload the page and confirm it persisted.
4. Edit `admin_notes` on a row → confirm it persists across a reload.
5. Click the `resolved` filter chip → only resolved rows show.
6. **Sign out and visit `/admin/feedback` directly** → you are redirected away, not shown the data. This confirms the admin layout guard covers the new route.

- [ ] **Step 10: Commit**

```bash
git add hooks/data/admin/feedback.ts app/admin/feedback app/admin/admin-nav-menu.tsx
git commit -m "feat(admin): add feedback triage list and detail views"
```

---

### Task 10: Accessibility pass and final verification

**Files:**

- Modify: whichever `components/feedback/*.tsx` files the audit flags.

**Interfaces:**

- Consumes: everything built in Tasks 7–9.
- Produces: no new interfaces.

- [ ] **Step 1: Run the a11y audit**

Dispatch the `a11y-reviewer` subagent against `components/feedback/`, `app/admin/feedback/`, and the modified `components/navbar/nav-footer.tsx`. Its brief: WCAG 2.1 AA for the dialog, form, image picker, and receipt.

- [ ] **Step 2: Fix what it finds**

Expect issues in these specific places, and verify each regardless of whether the audit flags it:

- The `Dialog` needs an accessible name — `aria-labelledby` pointing at the `DialogTitle`.
- Validation errors must be announced: MUI wires `helperText` to the input via `aria-describedby` when `error` is set, but confirm it in the DOM.
- The submit `Alert` for server errors should be `role="alert"` so it is announced on appearance.
- The image remove buttons need distinct accessible names (already `Remove {filename}` in Task 7 — confirm they are unique per file).
- The file input is visually hidden inside a `<Button component="label">`; confirm it is still reachable and operable by keyboard alone.
- Focus must move into the dialog on open and return to the trigger on close.

- [ ] **Step 3: Manual keyboard-only pass**

With the mouse untouched, on `/help`:

1. Tab to "Report an issue", press Enter → dialog opens and focus lands inside it.
2. Tab through every control: category, title, description, email, add-screenshots, cancel, send. Every one is reachable and shows a visible focus ring.
3. Press Escape → the dialog closes and focus returns to the trigger button.

- [ ] **Step 4: Verify the whole suite one final time**

Run: `yarn test && yarn tsc --noEmit && yarn lint && yarn build`
Expected: all tests pass, no type errors, no lint errors, and a clean production build. **The build is the real check on `sharp`** — if it fails to resolve in the route handler, that surfaces here rather than in production.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix(feedback): address accessibility audit findings"
```

- [ ] **Step 6: Open the PR**

Load the `git-workflow` skill first, then push the branch and open a PR against `main`. Never push directly to `main` — it is protected.

---

## Deferred: Email receipt (Resend)

**Not part of this plan by user decision.** Everything above ships without it.

When it is picked up, the work is:

1. Upgrade the Vercel CLI (`npm i -g vercel@latest` — the installed v50 has no `integration discover`).
2. Run `vercel integration discover --category messaging` and confirm Resend is in the live catalog; install with `vercel integration add resend`, or fall back to a direct resend.com signup with a `RESEND_API_KEY` env var.
3. **Verify a sending domain** in the Resend dashboard — a manual DNS step that cannot be automated and that blocks sending to arbitrary recipients.
4. Add the email template and a non-blocking send in `app/api/feedback/route.ts` after the row is committed, stamping `receipt_sent_at` on success. A send failure must never fail the submission.

The `receipt_sent_at` column already exists from Task 2, so no migration is needed.

---

## Self-Review Notes

**Spec coverage:** Data model → Task 2. Submission path incl. rate limiting, `sharp`, partial-failure → Tasks 5–6. In-app receipt → Task 7. Forms incl. deletion of the mailto path → Task 7. Per-page entry point → Task 8. Admin triage → Task 9. Accessibility → Task 10. Email receipt → deferred section, by user decision.

**Known deviation from the spec:** the spec's implementation order listed email as step 6 of 7; this plan drops it to a deferred section per the user's instruction to do everything else first.
