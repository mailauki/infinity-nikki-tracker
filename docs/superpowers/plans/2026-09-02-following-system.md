# Following System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store follow relationships in a many-to-many table and surface them as clickable Following/Followers counts on the profile card that open a searchable connections modal.

**Architecture:** A `public.follows` table keyed on `(follower_id, following_id)` with public SELECT and owner-scoped INSERT/DELETE. Reads go through `hooks/data/follows.ts` (React `cache()`); writes go through a `POST /api/follows` route handler rather than a Server Action (see Global Constraints). The modal is a shared client component in `components/follow/`, since both `/profile` and `/u/[username]` render it.

**Tech Stack:** Next.js 16 App Router, Supabase (Postgres + RLS), MUI v9, Vitest + Testing Library, notistack.

**Spec:** `docs/superpowers/specs/2026-09-02-following-system-design.md`

## Global Constraints

- **Package manager is Yarn.** Run `yarn test`, `yarn tsc --noEmit`, `yarn lint`. Never `npm` or `pnpm`.
- **Prettier:** no semicolons, single quotes, 2-space indent, 100 char width, ES5 trailing commas. A PostToolUse hook formats each edited file automatically.
- **Path alias `@/` maps to the project root.**
- **Never push directly to `main`.** Work happens on `feat/following-system`, already branched.
- **React `cache()` for reads only** — never wrap a mutation in `cache()`; it silently no-ops on repeat calls.
- **`use cache` is forbidden in anything calling `cookies()`** — every hook here is auth- or viewer-relative, so all use React `cache()`.
- **Writes go through a route handler, not a Server Action.** See "Correction to the spec" below — this supersedes the spec's `revalidatePath` decision.
- **Typography:** MUI's built-in variants (`h1`–`h6`, `body1/2`, `caption`) are typed `false`. Use `variant` = role (`display`/`headline`/`title`/`body`/`label`) + `size` (`large`/`medium`/`small`). Headings need an explicit `component="h2"`.
- **MUI `Stack` rejects layout shorthands as direct props** — `justifyContent`, `alignItems` etc. go in `sx`, or the build fails typecheck.
- **`LazyImage` is `memo`'d** — pass hoisted `sx` objects and fallback elements, never inline literals.
- **Quote paths containing `[slug]` in `git add`** — zsh glob-expands them otherwise.

## Correction to the spec

The spec's Data Layer section specifies `followUser`/`unfollowUser` as Server Actions calling
`revalidatePath('/u/[username]', 'page')`. **Implement a `POST /api/follows` route handler instead.**

Reason, discovered while mapping files: `app/u/[username]/page.tsx` awaits roughly ten sequential
collection queries per render (`getEurekaSets`, `getOutfitSets`, `getMakeupSets`, `getMomoCloaks` +
obtained, `getTrials`, `getSeasons`, and four `getRecentObtained*`). `revalidatePath` on that route
re-runs all of them on every follow toggle. Worse, `lib/save-preferences.ts` and the header comment
in `app/actions/preferences.ts` document that a Server Action which sets cookies — which the
Supabase SSR client does whenever it refreshes a session — marks its response revalidated and
invalidates the client router cache regardless. That is the exact pathology those two files exist to
avoid, and it cost a ~6.7s refetch per toggle on `/outfits`.

A route handler cannot trigger that revalidation. The modal already holds its own state, so it
updates optimistically from the response without needing the route re-rendered. The card counts
update optimistically in the same commit.

Everything else in the spec stands as written.

---

### Task 1: Migration — `follows` table, indexes, RLS

**Files:**

- Create: `supabase/migrations/20260902120000_add_follows_table.sql`

**Interfaces:**

- Consumes: nothing (first task).
- Produces: table `public.follows (follower_id uuid, following_id uuid, created_at timestamptz)`; policies `follows_public_select`, `follows_owner_insert`, `follows_owner_delete`.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260902120000_add_follows_table.sql`:

```sql
-- Follow relationships between profiles.
--
-- Direction convention: follower_id follows following_id. Stated explicitly
-- because both columns are uuid and a reversed read fails silently rather
-- than erroring.
--
-- PRIVACY: follow lists are world-readable, consistent with the decision in
-- 20260802002000_public_profile_read.sql to make profiles and collection
-- progress public. No contact details are exposed; profiles holds no email or
-- auth data.

-- Substring search over usernames needs trigram indexes.
create extension if not exists pg_trgm;

create table public.follows (
  -- FKs reference auth.users, matching feedback.user_id and the obtained_*
  -- tables. Reads join public.profiles on the same id for display.
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  -- Reserved for a future activity feed; nothing reads it yet.
  created_at timestamptz not null default now(),
  -- The composite PK IS the many-to-many join, and it makes follows idempotent
  -- for free: a duplicate follow is a PK violation, not a second row.
  primary key (follower_id, following_id),
  -- Rejected at the schema level, not merely hidden in the UI.
  constraint follows_no_self check (follower_id <> following_id)
);

-- The PK covers "who does X follow" (where follower_id = $1). The reverse
-- direction needs its own index — it runs on every profile page load for the
-- follower count and would otherwise seq-scan.
create index follows_following_id_idx on public.follows (following_id);

-- Support ilike '%q%' on both searchable profile fields.
create index profiles_username_search_idx
  on public.profiles using gin (username gin_trgm_ops);
create index profiles_display_name_search_idx
  on public.profiles using gin (display_name gin_trgm_ops);

alter table public.follows enable row level security;

-- Public read, mirroring the obtained_* pattern from 20260802002000.
create policy follows_public_select on public.follows
  for select using (true);

-- The with check is the security boundary that prevents forging a follow on
-- another user's behalf. Not the UI.
create policy follows_owner_insert on public.follows
  for insert to authenticated
  with check ((select auth.uid()) = follower_id);

-- No UPDATE policy: a follow row has no mutable fields, and unfollow is a
-- DELETE.
create policy follows_owner_delete on public.follows
  for delete to authenticated
  using ((select auth.uid()) = follower_id);
```

- [ ] **Step 2: Apply the migration locally and verify it succeeds**

Run: `supabase db reset`

Expected: replays every migration against the LOCAL database and ends without error. If the local
stack is not running, `supabase start` first.

Use `db reset`, NOT `db push` — `db push` targets the **remote** project. Pushing to production is
a separate, deliberate step that belongs with the PR, not with local development.

- [ ] **Step 3: Verify the constraints actually hold**

RLS that silently passes is the failure mode worth catching, so assert it directly rather than assuming.

Run this with `supabase db query` (or in the Studio SQL editor):

```sql
-- Self-follow must be rejected by the CHECK constraint.
-- Expected: ERROR violates check constraint "follows_no_self"
insert into public.follows (follower_id, following_id)
select id, id from auth.users limit 1;
```

Expected: `ERROR: new row for relation "follows" violates check constraint "follows_no_self"`

- [ ] **Step 4: Regenerate the Supabase types**

`lib/types/supabase.ts` is generated and is the source of truth — regenerate, never hand-edit.

Run: `supabase gen types typescript --local > lib/types/supabase.ts`

Verify `follows` now appears:

Run: `grep -n "follows:" lib/types/supabase.ts`
Expected: a `follows:` key with `Row`/`Insert`/`Update`.

- [ ] **Step 5: Typecheck**

Run: `yarn tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260902120000_add_follows_table.sql lib/types/supabase.ts
git commit -m "feat(follows): add follows table with public read and owner-scoped writes

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Types and search-query escaping

**Files:**

- Create: `lib/types/follows.ts`
- Create: `lib/follow-search.ts`
- Test: `lib/__tests__/follow-search.test.ts`

**Interfaces:**

- Consumes: `Tables<>` from `lib/types/supabase.ts` (Task 1).
- Produces:
  - `type FollowProfile = { id: string; username: string | null; display_name: string | null; avatar_url: string | null }`
  - `type FollowCounts = { following: number; followers: number }`
  - `escapeFilterValue(q: string): string`
  - `buildProfileSearchFilter(q: string): string`

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/follow-search.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildProfileSearchFilter, escapeFilterValue } from '@/lib/follow-search'

describe('escapeFilterValue', () => {
  it('passes an ordinary query through unchanged', () => {
    expect(escapeFilterValue('nikki')).toBe('nikki')
  })

  // `,` separates the clauses of an .or() filter. Left raw, a query containing
  // one injects an extra clause and changes which rows match.
  it('strips commas that would split the or() clause list', () => {
    expect(escapeFilterValue('a,b')).toBe('ab')
  })

  // `.` separates column.operator.value inside a clause.
  it('strips periods that would split column from operator', () => {
    expect(escapeFilterValue('a.b')).toBe('ab')
  })

  // `%` is the ilike wildcard — a bare one matches every row.
  it('strips percent signs so a query cannot become a wildcard', () => {
    expect(escapeFilterValue('%')).toBe('')
  })

  it('strips parentheses that would nest a filter group', () => {
    expect(escapeFilterValue('a(b)c')).toBe('abc')
  })
})

describe('buildProfileSearchFilter', () => {
  it('matches the query against both username and display_name', () => {
    expect(buildProfileSearchFilter('nik')).toBe('username.ilike.%nik%,display_name.ilike.%nik%')
  })

  it('uses the escaped query, not the raw one', () => {
    expect(buildProfileSearchFilter('a,b')).toBe('username.ilike.%ab%,display_name.ilike.%ab%')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test lib/__tests__/follow-search.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/follow-search"`.

- [ ] **Step 3: Write the types**

Create `lib/types/follows.ts`:

```ts
import { Tables } from './supabase'

export type Follow = Tables<'follows'>

// The profile fields a follow row is displayed with. Deliberately narrower than
// Tables<'profiles'> — the modal needs identity and an avatar, nothing else.
export type FollowProfile = Pick<
  Tables<'profiles'>,
  'id' | 'username' | 'display_name' | 'avatar_url'
>

export type FollowCounts = { following: number; followers: number }
```

- [ ] **Step 4: Write the minimal implementation**

Create `lib/follow-search.ts`:

```ts
// Search runs client-side and interpolates user input into a PostgREST .or()
// filter string, where `,` `.` `%` and parentheses are structural. This is not
// SQL injection — PostgREST parameterizes underneath — but unescaped input can
// still alter which rows match, so strip the structural characters rather than
// trusting the query.
const STRUCTURAL = /[,.%()]/g

export function escapeFilterValue(q: string): string {
  return q.replace(STRUCTURAL, '')
}

// Case-insensitive substring match across both searchable profile fields.
export function buildProfileSearchFilter(q: string): string {
  const safe = escapeFilterValue(q)
  return `username.ilike.%${safe}%,display_name.ilike.%${safe}%`
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `yarn test lib/__tests__/follow-search.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 6: Commit**

```bash
git add lib/types/follows.ts lib/follow-search.ts lib/__tests__/follow-search.test.ts
git commit -m "feat(follows): add follow types and search filter escaping

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Read hooks

**Files:**

- Create: `hooks/data/follows.ts`

**Interfaces:**

- Consumes: `FollowProfile`, `FollowCounts` (Task 2); `createClient` from `@/lib/supabase/server`.
- Produces:
  - `getFollowing(user_id: string): Promise<FollowProfile[]>`
  - `getFollowers(user_id: string): Promise<FollowProfile[]>`
  - `getFollowCounts(user_id: string): Promise<FollowCounts>`
  - `getIsFollowing(viewerId: string | null, targetId: string): Promise<boolean>`
  - `getViewerFollowingIds(viewerId: string | null): Promise<Set<string>>`

- [ ] **Step 1: Write the hooks**

Create `hooks/data/follows.ts`:

```ts
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { FollowCounts, FollowProfile } from '@/lib/types/follows'

// React cache(), not `use cache`: every function here calls cookies() via
// createClient(), which `use cache` forbids. cache() is also reads-only — never
// wrap the write path in it.

// The embedded profile columns each query selects. Kept in one place so the two
// directions cannot drift apart.
const PROFILE_FIELDS = 'id, username, display_name, avatar_url'

// Profiles this user follows. The join walks follows.following_id -> profiles.
export const getFollowing = cache(async (user_id: string): Promise<FollowProfile[]> => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('follows')
    .select(`profile:profiles!follows_following_id_fkey (${PROFILE_FIELDS})`)
    .eq('follower_id', user_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to load following:', error)
    return []
  }

  // A row whose profile failed to resolve is dropped rather than rendered blank.
  return (data ?? []).flatMap((row) => (row.profile ? [row.profile as FollowProfile] : []))
})

// Profiles following this user — the reverse direction, covered by
// follows_following_id_idx.
export const getFollowers = cache(async (user_id: string): Promise<FollowProfile[]> => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('follows')
    .select(`profile:profiles!follows_follower_id_fkey (${PROFILE_FIELDS})`)
    .eq('following_id', user_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to load followers:', error)
    return []
  }

  return (data ?? []).flatMap((row) => (row.profile ? [row.profile as FollowProfile] : []))
})

// head: true with an exact count fetches the numbers without transferring rows.
export const getFollowCounts = cache(async (user_id: string): Promise<FollowCounts> => {
  const supabase = await createClient()

  const [following, followers] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user_id),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user_id),
  ])

  // A failed count degrades to 0 rather than taking down the profile page.
  return { following: following.count ?? 0, followers: followers.count ?? 0 }
})

// The card's Follow button initial state.
export const getIsFollowing = cache(
  async (viewerId: string | null, targetId: string): Promise<boolean> => {
    // getUserID() returns null for signed-out visitors — guard before querying.
    if (!viewerId) return false

    const supabase = await createClient()

    const { count } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', viewerId)
      .eq('following_id', targetId)

    return (count ?? 0) > 0
  }
)

// Every id the viewer follows, for the modal's row buttons.
//
// Row buttons reflect the VIEWER's relationship to each row, not the profile
// owner's — so viewing someone else's Following list, a row you also follow
// reads "Following". Fetching the whole set once avoids an N+1 of per-row
// getIsFollowing calls.
export const getViewerFollowingIds = cache(
  async (viewerId: string | null): Promise<Set<string>> => {
    if (!viewerId) return new Set()

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', viewerId)

    if (error) {
      console.error('Failed to load viewer following ids:', error)
      return new Set()
    }

    return new Set((data ?? []).map((row) => row.following_id))
  }
)
```

- [ ] **Step 2: Verify the FK constraint names match the embed hints**

The `profiles!follows_following_id_fkey` syntax names the constraint. Postgres auto-named these
`follows_follower_id_fkey` / `follows_following_id_fkey` from Task 1's column references, but
confirm rather than assume — a wrong hint fails at runtime, not compile time.

Run: `supabase db query "select conname from pg_constraint where conrelid = 'public.follows'::regclass and contype = 'f'"`
Expected: two rows — `follows_follower_id_fkey` and `follows_following_id_fkey`.

If they differ, update the two `select()` hints to the actual names.

- [ ] **Step 3: Typecheck**

Run: `yarn tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add hooks/data/follows.ts
git commit -m "feat(follows): add follow read hooks

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Write path — `POST /api/follows`

**Files:**

- Create: `app/api/follows/route.ts`
- Create: `lib/follow-actions.ts`

**Interfaces:**

- Consumes: `createClient` from `@/lib/supabase/server`.
- Produces:
  - `POST /api/follows` accepting `{ targetId: string, action: 'follow' | 'unfollow' }`
  - `followUser(targetId: string): Promise<void>` (client helper)
  - `unfollowUser(targetId: string): Promise<void>` (client helper)

- [ ] **Step 1: Write the route handler**

Create `app/api/follows/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// A route handler rather than a Server Action, deliberately.
//
// A Server Action that sets cookies — which the Supabase SSR client does
// whenever it refreshes a session — marks its response revalidated, which
// invalidates the client router cache. On /u/[username] that re-runs ~10
// sequential collection queries per follow toggle. See lib/save-preferences.ts,
// which exists for the same reason on the preferences path.
export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  let body: { targetId?: unknown; action?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Malformed body' }, { status: 400 })
  }

  const { targetId, action } = body

  if (typeof targetId !== 'string' || (action !== 'follow' && action !== 'unfollow')) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  // The follower is always the caller, re-derived server-side. It is never read
  // from the request, so a caller cannot act as another user. RLS enforces this
  // too; this is the cheaper, clearer rejection.
  if (targetId === user.id) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
  }

  if (action === 'follow') {
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: user.id, following_id: targetId })

    // 23505 is a unique/PK violation: the row we wanted already exists, so the
    // caller's intent is already satisfied. Treating it as success makes a
    // double-click idempotent instead of an error toast.
    if (error && error.code !== '23505') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ following: true })
  }

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', targetId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ following: false })
}
```

- [ ] **Step 2: Write the client helpers**

Create `lib/follow-actions.ts`:

```ts
// Client-side helpers over POST /api/follows. See the route handler for why the
// write path is a route rather than a Server Action.

async function post(targetId: string, action: 'follow' | 'unfollow') {
  const res = await fetch('/api/follows', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetId, action }),
  })

  if (!res.ok) {
    const message = await res
      .json()
      .then((body: { error?: string }) => body.error)
      .catch(() => null)
    throw new Error(message ?? `POST /api/follows returned ${res.status}`)
  }
}

export function followUser(targetId: string) {
  return post(targetId, 'follow')
}

export function unfollowUser(targetId: string) {
  return post(targetId, 'unfollow')
}
```

- [ ] **Step 3: Typecheck**

Run: `yarn tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Verify RLS blocks a forged follow**

The route re-derives the follower, but RLS is the actual boundary — verify it independently, because
a `with check` that silently passes is the failure mode worth catching.

Run with `supabase db query`, impersonating one user while naming another as follower:

```sql
-- Pick two real user ids.
select id from auth.users limit 2;

-- Impersonate the FIRST id, then try to insert a row whose follower_id is the
-- SECOND. Substitute the ids below.
set local role authenticated;
set local request.jwt.claims = '{"sub":"<FIRST_ID>","role":"authenticated"}';

insert into public.follows (follower_id, following_id)
values ('<SECOND_ID>', '<FIRST_ID>');
```

Expected: `ERROR: new row violates row-level security policy for table "follows"`

- [ ] **Step 5: Commit**

```bash
git add app/api/follows/route.ts lib/follow-actions.ts
git commit -m "feat(follows): add follow/unfollow write route

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Follow button

**Files:**

- Create: `components/follow/follow-button.tsx`
- Test: `components/__tests__/follow-button.test.tsx`

**Interfaces:**

- Consumes: `followUser`, `unfollowUser` (Task 4).
- Produces: `<FollowButton targetId isFollowing isSelf isLoggedIn size onChange />`, default export.

- [ ] **Step 1: Write the failing test**

Create `components/__tests__/follow-button.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FollowButton from '@/components/follow/follow-button'

vi.mock('@/lib/follow-actions', () => ({
  followUser: vi.fn(() => Promise.resolve()),
  unfollowUser: vi.fn(() => Promise.resolve()),
}))

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))

import { followUser, unfollowUser } from '@/lib/follow-actions'

describe('FollowButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders nothing for the viewer's own row", () => {
    const { container } = render(<FollowButton isSelf isLoggedIn targetId="u1" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when signed out', () => {
    const { container } = render(<FollowButton isLoggedIn={false} targetId="u1" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('reads "Follow" when not following', () => {
    render(<FollowButton isLoggedIn targetId="u1" />)
    expect(screen.getByRole('button', { name: /^follow$/i })).toBeInTheDocument()
  })

  it('reads "Following" when already following', () => {
    render(<FollowButton isFollowing isLoggedIn targetId="u1" />)
    expect(screen.getByRole('button', { name: /following/i })).toBeInTheDocument()
  })

  it('flips to Following optimistically before the request settles', async () => {
    const user = userEvent.setup()
    render(<FollowButton isLoggedIn targetId="u1" />)

    await user.click(screen.getByRole('button', { name: /^follow$/i }))

    expect(followUser).toHaveBeenCalledWith('u1')
    expect(screen.getByRole('button', { name: /following/i })).toBeInTheDocument()
  })

  it('unfollows when already following', async () => {
    const user = userEvent.setup()
    render(<FollowButton isFollowing isLoggedIn targetId="u1" />)

    await user.click(screen.getByRole('button', { name: /following/i }))

    expect(unfollowUser).toHaveBeenCalledWith('u1')
    expect(screen.getByRole('button', { name: /^follow$/i })).toBeInTheDocument()
  })

  // The optimistic flip must not strand the UI in a state the DB disagrees with.
  it('reverts when the request fails', async () => {
    vi.mocked(followUser).mockRejectedValueOnce(new Error('nope'))
    const user = userEvent.setup()
    render(<FollowButton isLoggedIn targetId="u1" />)

    await user.click(screen.getByRole('button', { name: /^follow$/i }))

    expect(await screen.findByRole('button', { name: /^follow$/i })).toBeInTheDocument()
  })

  it('notifies the parent so counts can update', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<FollowButton isLoggedIn targetId="u1" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /^follow$/i }))

    expect(onChange).toHaveBeenCalledWith(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test components/__tests__/follow-button.test.tsx`
Expected: FAIL — `Failed to resolve import "@/components/follow/follow-button"`.

- [ ] **Step 3: Write the implementation**

Create `components/follow/follow-button.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { Button } from '@mui/material'
import { Add, Check } from '@mui/icons-material'
import { enqueueSnackbar } from 'notistack'
import { followUser, unfollowUser } from '@/lib/follow-actions'

export default function FollowButton({
  targetId,
  isFollowing = false,
  isSelf = false,
  isLoggedIn = false,
  size = 'small',
  onChange,
}: {
  targetId: string
  isFollowing?: boolean
  /** The row is the viewer's own profile — there is nothing to follow. */
  isSelf?: boolean
  isLoggedIn?: boolean
  size?: 'small' | 'medium' | 'large'
  /** Fired with the new state so a parent can adjust its counts optimistically. */
  onChange?: (following: boolean) => void
}) {
  const [following, setFollowing] = useState(isFollowing)
  const [pending, startTransition] = useTransition()

  // Signed-out visitors and the viewer's own row get no control at all, rather
  // than a dead disabled one.
  if (isSelf || !isLoggedIn) return null

  const handleClick = () => {
    const next = !following

    // Optimistic: flip immediately, revert if the write fails.
    setFollowing(next)
    onChange?.(next)

    startTransition(async () => {
      try {
        await (next ? followUser(targetId) : unfollowUser(targetId))
      } catch {
        setFollowing(!next)
        onChange?.(!next)
        enqueueSnackbar(next ? 'Could not follow' : 'Could not unfollow', { variant: 'error' })
      }
    })
  }

  return (
    <Button
      disabled={pending}
      endIcon={following ? <Check /> : <Add />}
      size={size}
      sx={{ borderRadius: 40, whiteSpace: 'nowrap' }}
      variant={following ? 'outlined' : 'contained'}
      onClick={handleClick}
    >
      {following ? 'Following' : 'Follow'}
    </Button>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test components/__tests__/follow-button.test.tsx`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add components/follow/follow-button.tsx components/__tests__/follow-button.test.tsx
git commit -m "feat(follows): add optimistic follow button

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Profile row

**Files:**

- Create: `components/follow/follow-row.tsx`

**Interfaces:**

- Consumes: `FollowProfile` (Task 2), `FollowButton` (Task 5), `LazyImage` from `@/components/lazy-image`.
- Produces: `<FollowRow profile isFollowing isSelf isLoggedIn onFollowChange />`, default export.

- [ ] **Step 1: Write the implementation**

Create `components/follow/follow-row.tsx`:

```tsx
'use client'

import { Box, Stack, Typography } from '@mui/material'
import { Person } from '@mui/icons-material'
import Link from 'next/link'
import LazyImage from '@/components/lazy-image'
import type { FollowProfile } from '@/lib/types/follows'
import FollowButton from './follow-button'

// Hoisted: LazyImage is memo'd, so an inline sx object or fallback element
// silently defeats the memo on every render of a long list.
const AVATAR_FALLBACK = <Person fontSize="inherit" />
const ROW_SX = { alignItems: 'center', justifyContent: 'space-between', py: 1 }
const LINK_SX = { alignItems: 'center', flex: 1, minWidth: 0, textDecoration: 'none' }
const NAME_SX = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }

export default function FollowRow({
  profile,
  isFollowing = false,
  isSelf = false,
  isLoggedIn = false,
  onFollowChange,
}: {
  profile: FollowProfile
  isFollowing?: boolean
  isSelf?: boolean
  isLoggedIn?: boolean
  onFollowChange?: (id: string, following: boolean) => void
}) {
  return (
    <Stack direction="row" spacing={1} sx={ROW_SX}>
      <Stack
        component={Link}
        direction="row"
        href={`/u/${profile.username}`}
        spacing={1.5}
        sx={LINK_SX}
      >
        {/* size="sm" opts into the edge-resized thumbnail path. */}
        <LazyImage alt="" size="sm" src={profile.avatar_url} variant="circular">
          {AVATAR_FALLBACK}
        </LazyImage>
        <Box sx={{ minWidth: 0 }}>
          <Typography color="textPrimary" component="div" sx={NAME_SX} variant="body">
            {profile.display_name ?? profile.username ?? '—'}
          </Typography>
          <Typography
            color="textSecondary"
            component="div"
            size="small"
            sx={NAME_SX}
            variant="body"
          >
            @{profile.username ?? '—'}
          </Typography>
        </Box>
      </Stack>

      <FollowButton
        isFollowing={isFollowing}
        isLoggedIn={isLoggedIn}
        isSelf={isSelf}
        targetId={profile.id}
        onChange={(following) => onFollowChange?.(profile.id, following)}
      />
    </Stack>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `yarn tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/follow/follow-row.tsx
git commit -m "feat(follows): add profile row for follow lists

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Connections dialog with search

**Files:**

- Create: `components/follow/follow-dialog.tsx`
- Test: `components/__tests__/follow-dialog.test.tsx`

**Interfaces:**

- Consumes: `FollowProfile` (Task 2), `FollowRow` (Task 6), `buildProfileSearchFilter` (Task 2), `createClient` from `@/lib/supabase/client`.
- Produces: `<FollowDialog open onClose tab onTabChange following followers viewerId viewerFollowingIds />`, default export; `export type FollowTab = 'following' | 'followers'`.

- [ ] **Step 1: Write the failing test**

Create `components/__tests__/follow-dialog.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FollowDialog from '@/components/follow/follow-dialog'

vi.mock('@/lib/follow-actions', () => ({
  followUser: vi.fn(() => Promise.resolve()),
  unfollowUser: vi.fn(() => Promise.resolve()),
}))

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))

const searchResults = vi.fn(() => Promise.resolve({ data: [], error: null }))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        or: () => ({
          neq: () => ({
            order: () => ({ limit: searchResults }),
          }),
        }),
      }),
    }),
  }),
}))

const ALICE = { id: 'u1', username: 'alice', display_name: 'Alice', avatar_url: null }
const BOB = { id: 'u2', username: 'bob', display_name: 'Bob', avatar_url: null }

function setup(props: Partial<React.ComponentProps<typeof FollowDialog>> = {}) {
  return render(
    <FollowDialog
      open
      followers={[BOB]}
      following={[ALICE]}
      tab="following"
      viewerFollowingIds={new Set(['u1'])}
      viewerId="viewer"
      onClose={() => {}}
      onTabChange={() => {}}
      {...props}
    />
  )
}

describe('FollowDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    searchResults.mockResolvedValue({ data: [], error: null })
  })

  it('lists the following tab by default', () => {
    setup()
    expect(screen.getByText('@alice')).toBeInTheDocument()
    expect(screen.queryByText('@bob')).not.toBeInTheDocument()
  })

  it('lists followers when opened on that tab', () => {
    setup({ tab: 'followers' })
    expect(screen.getByText('@bob')).toBeInTheDocument()
    expect(screen.queryByText('@alice')).not.toBeInTheDocument()
  })

  it('shows an empty state rather than a blank body', () => {
    setup({ following: [] })
    expect(screen.getByText(/not following anyone yet/i)).toBeInTheDocument()
  })

  it('swaps the body to search results while a query is present', async () => {
    searchResults.mockResolvedValue({ data: [BOB], error: null })
    const user = userEvent.setup()
    setup()

    await user.type(screen.getByRole('textbox', { name: /search/i }), 'bob')

    // The tab list is replaced by results, not filtered in place.
    expect(await screen.findByText('@bob')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('@alice')).not.toBeInTheDocument())
  })

  it('restores the tab list when the query is cleared', async () => {
    searchResults.mockResolvedValue({ data: [BOB], error: null })
    const user = userEvent.setup()
    setup()

    const input = screen.getByRole('textbox', { name: /search/i })
    await user.type(input, 'bob')
    await screen.findByText('@bob')

    await user.clear(input)

    expect(await screen.findByText('@alice')).toBeInTheDocument()
  })

  it('tells the user when a search returns nothing', async () => {
    const user = userEvent.setup()
    setup()

    await user.type(screen.getByRole('textbox', { name: /search/i }), 'zzz')

    expect(await screen.findByText(/no profiles found/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test components/__tests__/follow-dialog.test.tsx`
Expected: FAIL — `Failed to resolve import "@/components/follow/follow-dialog"`.

- [ ] **Step 3: Write the implementation**

Create `components/follow/follow-dialog.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { Search } from '@mui/icons-material'
import { createClient } from '@/lib/supabase/client'
import { buildProfileSearchFilter, escapeFilterValue } from '@/lib/follow-search'
import type { FollowProfile } from '@/lib/types/follows'
import FollowRow from './follow-row'

export type FollowTab = 'following' | 'followers'

const SEARCH_DEBOUNCE_MS = 300
const SEARCH_LIMIT = 20

export default function FollowDialog({
  open,
  onClose,
  tab,
  onTabChange,
  following,
  followers,
  viewerId,
  viewerFollowingIds,
}: {
  open: boolean
  onClose: () => void
  tab: FollowTab
  onTabChange: (tab: FollowTab) => void
  following: FollowProfile[]
  followers: FollowProfile[]
  /** null when signed out — gates the row buttons. */
  viewerId: string | null
  /** Ids the VIEWER follows, so row buttons reflect their relationship. */
  viewerFollowingIds: Set<string>
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FollowProfile[]>([])
  const [searching, setSearching] = useState(false)

  // Local overlay of follow changes made inside the dialog, so a row's button
  // stays correct without refetching the whole list.
  const [changed, setChanged] = useState<Map<string, boolean>>(new Map())

  const trimmed = query.trim()
  const isSearching = trimmed.length > 0

  useEffect(() => {
    if (!isSearching) {
      setResults([])
      return
    }

    // A query of only structural characters escapes to empty, which would
    // otherwise become a bare wildcard matching every profile.
    if (!escapeFilterValue(trimmed)) {
      setResults([])
      return
    }

    setSearching(true)
    let cancelled = false

    // Debounced: the search runs client-side per keystroke, so without this it
    // would issue a request per character.
    const timer = setTimeout(async () => {
      const supabase = createClient()
      let request = supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .or(buildProfileSearchFilter(trimmed))

      // Never offer the viewer their own profile as a follow target.
      if (viewerId) request = request.neq('id', viewerId)

      const { data } = await request.order('username').limit(SEARCH_LIMIT)

      if (cancelled) return
      setResults((data as FollowProfile[]) ?? [])
      setSearching(false)
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [trimmed, isSearching, viewerId])

  const handleFollowChange = (id: string, isFollowing: boolean) => {
    setChanged((prev) => new Map(prev).set(id, isFollowing))
  }

  const isFollowingProfile = (id: string) => changed.get(id) ?? viewerFollowingIds.has(id)

  const list = isSearching ? results : tab === 'following' ? following : followers

  const emptyMessage = isSearching
    ? searching
      ? 'Searching…'
      : 'No profiles found'
    : tab === 'following'
      ? 'Not following anyone yet'
      : 'No followers yet'

  return (
    <Dialog fullWidth maxWidth="xs" open={open} onClose={onClose}>
      <DialogTitle>Connections</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          placeholder="Search profiles…"
          size="small"
          slotProps={{
            htmlInput: { 'aria-label': 'Search profiles' },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 1 }}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        {/* Tabs stay mounted while searching so clearing the query returns to
            the same tab the user left. */}
        <Tabs
          sx={{ mb: 1, visibility: isSearching ? 'hidden' : 'visible' }}
          value={tab}
          onChange={(_, next: FollowTab) => onTabChange(next)}
        >
          <Tab label="Following" value="following" />
          <Tab label="Followers" value="followers" />
        </Tabs>

        {list.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="textSecondary" component="p" variant="body">
              {emptyMessage}
            </Typography>
          </Box>
        ) : (
          <Stack>
            {list.map((profile) => (
              <FollowRow
                key={profile.id}
                isFollowing={isFollowingProfile(profile.id)}
                isLoggedIn={Boolean(viewerId)}
                isSelf={profile.id === viewerId}
                profile={profile}
                onFollowChange={handleFollowChange}
              />
            ))}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test components/__tests__/follow-dialog.test.tsx`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add components/follow/follow-dialog.tsx components/__tests__/follow-dialog.test.tsx
git commit -m "feat(follows): add connections dialog with profile search

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Clickable counts on the profile card

**Files:**

- Create: `components/follow/follow-counts.tsx`
- Test: `components/__tests__/follow-counts.test.tsx`

**Interfaces:**

- Consumes: `FollowProfile` (Task 2), `FollowDialog` + `FollowTab` (Task 7).
- Produces: `<FollowCountsRow following followers followingCount followersCount viewerId viewerFollowingIds />`, default export.

- [ ] **Step 1: Write the failing test**

Create `components/__tests__/follow-counts.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import FollowCountsRow from '@/components/follow/follow-counts'

vi.mock('@/lib/follow-actions', () => ({
  followUser: vi.fn(() => Promise.resolve()),
  unfollowUser: vi.fn(() => Promise.resolve()),
}))

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        or: () => ({
          neq: () => ({
            order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
          }),
        }),
      }),
    }),
  }),
}))

const ALICE = { id: 'u1', username: 'alice', display_name: 'Alice', avatar_url: null }
const BOB = { id: 'u2', username: 'bob', display_name: 'Bob', avatar_url: null }

function setup() {
  return render(
    <FollowCountsRow
      followers={[BOB]}
      followersCount={34}
      following={[ALICE]}
      followingCount={12}
      viewerFollowingIds={new Set<string>()}
      viewerId="viewer"
    />
  )
}

describe('FollowCountsRow', () => {
  it('shows both counts', () => {
    setup()
    expect(screen.getByRole('button', { name: /12 following/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /34 followers/i })).toBeInTheDocument()
  })

  // Buttons, not clickable Typography: a Typography is neither focusable nor
  // announced as a control.
  it('exposes the counts as real buttons', () => {
    setup()
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('opens the dialog on the following tab', async () => {
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByRole('button', { name: /12 following/i }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('@alice')).toBeInTheDocument()
  })

  it('opens the dialog on the followers tab', async () => {
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByRole('button', { name: /34 followers/i }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('@bob')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test components/__tests__/follow-counts.test.tsx`
Expected: FAIL — `Failed to resolve import "@/components/follow/follow-counts"`.

- [ ] **Step 3: Write the implementation**

Create `components/follow/follow-counts.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Button, Stack, Typography } from '@mui/material'
import type { FollowProfile } from '@/lib/types/follows'
import FollowDialog, { type FollowTab } from './follow-dialog'

// Buttons styled as text rather than a clickable Typography: a Typography is
// neither keyboard-focusable nor announced as a control.
const COUNT_SX = {
  color: 'secondary.main',
  minWidth: 0,
  p: 0,
  textTransform: 'none',
  whiteSpace: 'nowrap',
  '&:hover': { background: 'none', textDecoration: 'underline' },
}

export default function FollowCountsRow({
  following,
  followers,
  followingCount,
  followersCount,
  viewerId,
  viewerFollowingIds,
}: {
  following: FollowProfile[]
  followers: FollowProfile[]
  followingCount: number
  followersCount: number
  viewerId: string | null
  viewerFollowingIds: Set<string>
}) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<FollowTab>('following')

  const openOn = (next: FollowTab) => {
    setTab(next)
    setOpen(true)
  }

  return (
    <>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Button disableRipple sx={COUNT_SX} onClick={() => openOn('following')}>
          <Typography component="span" size="small" variant="body">
            <strong>{followingCount}</strong> Following
          </Typography>
        </Button>
        <Button disableRipple sx={COUNT_SX} onClick={() => openOn('followers')}>
          <Typography component="span" size="small" variant="body">
            <strong>{followersCount}</strong> Followers
          </Typography>
        </Button>
      </Stack>

      <FollowDialog
        followers={followers}
        following={following}
        open={open}
        tab={tab}
        viewerFollowingIds={viewerFollowingIds}
        viewerId={viewerId}
        onClose={() => setOpen(false)}
        onTabChange={setTab}
      />
    </>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test components/__tests__/follow-counts.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add components/follow/follow-counts.tsx components/__tests__/follow-counts.test.tsx
git commit -m "feat(follows): add clickable following/followers counts

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9: Wire the card and the profile page

**Files:**

- Modify: `app/profile/profile-card.tsx` (the `subheader` Stack, and the `action` Follow button)
- Modify: `app/u/[username]/page.tsx` (fetch follow data, pass it down)

**Interfaces:**

- Consumes: `FollowCountsRow` (Task 8), `FollowButton` (Task 5), the Task 3 hooks.
- Produces: nothing downstream — this is the integration task.

- [ ] **Step 1: Replace the hardcoded count in the card**

In `app/profile/profile-card.tsx`, add to the imports:

```tsx
import FollowButton from '@/components/follow/follow-button'
import FollowCountsRow from '@/components/follow/follow-counts'
import type { FollowProfile } from '@/lib/types/follows'
```

Add these props to the component's destructured parameters and its type:

```tsx
  following = [],
  followers = [],
  followingCount = 0,
  followersCount = 0,
  isFollowing = false,
  viewerId = null,
  viewerFollowingIds,
```

```tsx
  following?: FollowProfile[]
  followers?: FollowProfile[]
  followingCount?: number
  followersCount?: number
  /** Whether the viewer already follows this profile. */
  isFollowing?: boolean
  /** null when signed out. */
  viewerId?: string | null
  viewerFollowingIds?: Set<string>
```

Replace the entire `subheader` Stack — the one currently holding the `Person` icon and hardcoded
`0` — with:

```tsx
          subheader={
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Typography color="textSecondary" component="span" size="large" variant="body">
                @{username ?? '—'}
              </Typography>
              <FollowCountsRow
                followers={followers}
                followersCount={followersCount}
                following={following}
                followingCount={followingCount}
                viewerFollowingIds={viewerFollowingIds ?? new Set()}
                viewerId={viewerId}
              />
            </Stack>
          }
```

- [ ] **Step 2: Make the Follow button live**

Still in `app/profile/profile-card.tsx`, replace the `disabled` placeholder button in the `action`
prop's `: (` branch with:

```tsx
<FollowButton
  isFollowing={isFollowing}
  isLoggedIn={Boolean(viewerId)}
  size="large"
  targetId={profileId}
/>
```

Add `profileId` to the props (type `string`), since the button needs the target's id — the card
previously only received display fields.

- [ ] **Step 3: Fetch and pass the data**

In `app/u/[username]/page.tsx`, add the import:

```tsx
import {
  getFollowCounts,
  getFollowers,
  getFollowing,
  getIsFollowing,
  getViewerFollowingIds,
} from '@/hooks/data/follows'
```

After the existing `const isOwner = viewerId === profile.id` line, add:

```tsx
// Follow data for the card and its modal. Parallel — none depends on another,
// and the page already awaits ~10 collection queries sequentially.
const [followCounts, following, followers, isFollowing, viewerFollowingIds] = await Promise.all([
  getFollowCounts(profile.id),
  getFollowing(profile.id),
  getFollowers(profile.id),
  getIsFollowing(viewerId, profile.id),
  getViewerFollowingIds(viewerId),
])
```

Then extend the `<ProfileCard ... />` call in the `profile={...}` slot with:

```tsx
          followers={followers}
          followersCount={followCounts.followers}
          following={following}
          followingCount={followCounts.following}
          isFollowing={isFollowing}
          profileId={profile.id}
          viewerFollowingIds={viewerFollowingIds}
          viewerId={viewerId}
```

- [ ] **Step 4: Typecheck**

Run: `yarn tsc --noEmit`
Expected: no errors. A missing `profileId` on the card is the likely failure — `app/settings/profile-form.tsx` imports `DEFAULT_BANNER` from this file but does not render the card, so it needs no change.

- [ ] **Step 5: Run the full suite**

Run: `yarn test`
Expected: PASS, including the pre-existing suites.

- [ ] **Step 6: Verify in the running app**

Run: `yarn dev`

Check, at `/profile`:

- Both counts render real numbers.
- Clicking "Following" opens the dialog on the Following tab; "Followers" opens it on Followers.
- Typing in search returns profiles; clearing restores the tab list.
- Following someone from a search row flips the button and survives a page reload.
- Your own profile shows "Edit profile", not a Follow button.

Then open another user's profile at `/u/<their-username>` and confirm the Follow button follows and unfollows, and the follower count reflects it after a reload.

- [ ] **Step 7: Commit**

```bash
git add app/profile/profile-card.tsx 'app/u/[username]/page.tsx'
git commit -m "feat(follows): wire follow counts and button into the profile card

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 10: Final verification

**Files:** none — verification only.

- [ ] **Step 1: Format, lint, typecheck**

Run: `yarn format && yarn lint && yarn tsc --noEmit`
Expected: clean.

- [ ] **Step 2: Full test suite**

Run: `yarn test`
Expected: all pass. Report the actual count; do not claim a pass without seeing the output.

- [ ] **Step 3: Confirm no Server Action crept into the write path**

Run: `grep -rn "revalidatePath" app/api/follows/ components/follow/ 2>/dev/null || echo "clean"`
Expected: `clean`. The write path is a route handler by design — see "Correction to the spec".

- [ ] **Step 4: Push and open a PR**

Load the `git-workflow` skill first, then push `feat/following-system` and open the PR against `main`.

---

## Self-Review

**Spec coverage:**

| Spec section                                                                                     | Task |
| ------------------------------------------------------------------------------------------------ | ---- |
| `follows` table, PK, self-follow CHECK                                                           | 1    |
| Indexes (reverse direction, trigram search)                                                      | 1    |
| RLS: public SELECT, owner INSERT/DELETE                                                          | 1    |
| Types                                                                                            | 2    |
| Search escaping                                                                                  | 2    |
| `getFollowing` / `getFollowers` / `getFollowCounts` / `getIsFollowing` / `getViewerFollowingIds` | 3    |
| Follow/unfollow writes, `23505` idempotency                                                      | 4    |
| Client-side debounced search                                                                     | 7    |
| Card counts as buttons                                                                           | 8    |
| Dialog: persistent search above tabs                                                             | 7    |
| Row buttons reflect the viewer's relationship                                                    | 6, 7 |
| Live Follow button, signed-out handling                                                          | 5, 9 |
| RLS verification tests                                                                           | 1, 4 |

**Deviation from spec:** the write path is a route handler, not a Server Action with
`revalidatePath` — documented under "Correction to the spec" above, with the reasoning.

**Type consistency:** `FollowProfile` and `FollowCounts` are defined once in Task 2 and consumed
unchanged in Tasks 3, 6, 7, 8, 9. `FollowTab` is defined in Task 7 and consumed in Task 8.
`onChange(following: boolean)` on `FollowButton` (Task 5) is adapted to
`onFollowChange(id, following)` by `FollowRow` (Task 6) — the widening is deliberate and the
signatures match at each boundary.
