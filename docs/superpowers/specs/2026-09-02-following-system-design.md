# Following System Design

**Date:** 2026-09-02
**Status:** Approved

## Problem

`app/profile/profile-card.tsx` renders two placeholders for a follow system that does not exist:

1. A `Typography` in the `subheader` showing a `Person` icon beside a hardcoded `0`.
2. A `Follow` button in the `action` slot, permanently `disabled`, with the comment
   _"visitors get the Follow placeholder, still disabled until a follow system exists."_

There is no table storing follow relationships, so neither can do anything. `/u/[username]`
already renders another user's profile and collection stats publicly, which is the surface a
follow system belongs on.

## Goals

- Store follow relationships as a many-to-many table with correct RLS.
- Replace the hardcoded `0` with real, clickable Following and Followers counts.
- Open a modal from either count listing those profiles, with search for discovering others.
- Make the existing `Follow` button work, from both the card and every modal row.

## Non-Goals

Explicitly out of scope for this pass:

- Notifications on a new follower (in-app or email).
- Follow requests / approval flows — follows are unilateral and take effect immediately.
- A follower-activity feed ("people you follow just obtained X").
- Blocking or muting.

None requires reworking what this design builds. `follows.created_at` exists from the start so a
feed or "new since last visit" can be added later without a migration.

## Data Model

### `follows`

| Column         | Type                           | Notes                                   |
| -------------- | ------------------------------ | --------------------------------------- |
| `follower_id`  | `uuid NOT NULL`                | FK → `auth.users(id)` ON DELETE CASCADE |
| `following_id` | `uuid NOT NULL`                | FK → `auth.users(id)` ON DELETE CASCADE |
| `created_at`   | `timestamptz NOT NULL` `now()` | Reserved for a future activity feed     |

`PRIMARY KEY (follower_id, following_id)` — the composite PK _is_ the many-to-many join, and it
makes follows idempotent for free: a duplicate follow is a PK violation rather than a second row.

`CONSTRAINT follows_no_self CHECK (follower_id <> following_id)` — self-follows are rejected at
the schema level, not merely hidden in the UI.

**Direction convention:** `follower_id` follows `following_id`. Stated explicitly because the two
columns are the same type and a reversed read is silent — every query and test in this design
depends on this reading.

### Indexes

- The composite PK covers `where follower_id = $1` — "who does X follow".
- `follows_following_id_idx on public.follows (following_id)` covers the reverse direction,
  `where following_id = $1` — "who follows X". Without it that query seq-scans, and it runs on
  every profile page load for the follower count.
- `profiles_username_search_idx` / `profiles_display_name_search_idx` — `gin_trgm_ops` indexes
  supporting the `ilike '%q%'` substring match used by search. Requires the `pg_trgm` extension;
  the migration creates it `if not exists`.

FKs reference `auth.users`, matching `feedback.user_id` and the `obtained_*` tables. Because the
modal displays profiles, reads join `public.profiles` on the same id.

### RLS

Mirrors the `obtained_*` pattern established in `20260802002000_public_profile_read.sql`.

| Command | Policy                                                            |
| ------- | ----------------------------------------------------------------- |
| SELECT  | `using (true)` — public                                           |
| INSERT  | `to authenticated with check ((select auth.uid()) = follower_id)` |
| DELETE  | `to authenticated using ((select auth.uid()) = follower_id)`      |

No UPDATE policy: a follow row has no mutable fields, and unfollow is a DELETE. The INSERT
`with check` is what prevents forging a follow on another user's behalf — it is the security
boundary, not the UI.

**Privacy:** follow lists are world-readable, consistent with the existing decision in
`20260802002000` to make profiles and collection progress public. No contact details are exposed;
`profiles` holds no email or auth data.

## Data Layer

### `hooks/data/follows.ts`

All five use React `cache()`, **not** `use cache` — they call `cookies()` via `createClient()`,
which `use cache` forbids (CLAUDE.md).

| Function                             | Returns                                       |
| ------------------------------------ | --------------------------------------------- |
| `getFollowing(user_id)`              | Profiles this user follows                    |
| `getFollowers(user_id)`              | Profiles following this user                  |
| `getFollowCounts(user_id)`           | `{ following, followers }`                    |
| `getIsFollowing(viewerId, targetId)` | `boolean` — the card's Follow button state    |
| `getViewerFollowingIds(viewerId)`    | `Set<string>` — ids the viewer follows        |

`getFollowCounts` uses `head: true, count: 'exact'` for both numbers, so the card fetches counts
without transferring rows. Per CLAUDE.md, `getUserID()` returns `null` for signed-out visitors —
`getIsFollowing` guards on that and returns `false` rather than querying.

### `app/profile/actions.ts` (new)

`followUser(targetId)` and `unfollowUser(targetId)` Server Actions. Both re-derive the follower
from `getUserID()` server-side and **never** accept it as a parameter, so a caller cannot act as
another user. Both `revalidatePath('/u/[username]', 'page')`.

`followUser` treats a PK violation (Postgres `23505`) as success — the row it wanted already
exists. This makes a double-click idempotent instead of an error toast.

### Search

Runs client-side through `lib/supabase/client.ts`, **not** a Server Action: it fires per keystroke
(debounced 300ms), and a Server Action per keystroke means a POST plus a full route revalidation
each time. Profiles are already publicly SELECT-able, so the browser client queries them directly:

```ts
.or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
```

Case-insensitive substring on both fields, capped at 20 rows, ordered by `username`. The viewer's
own row is filtered out of results. No RPC or `SECURITY DEFINER` view is needed — verified against
`20260802002000_public_profile_read.sql`, which set `profiles_public_select ... using (true)`.

User input reaches a PostgREST filter string here, so `q` is escaped for the `,` `.` and `%`
characters that are structural in `.or()` syntax before interpolation.

## UI

`follows` is cross-cutting — not owned by one domain the way `eureka` and `outfits` are — and the
modal is imported by both `/profile` and `/u/[username]`. Per CLAUDE.md's colocation rule it
therefore lives in `components/follow/`, not colocated with either route.

### Card counts

The hardcoded `0` in the `subheader` is replaced by two counts:

```text
@username    12 Following · 34 Followers
```

Both render as `Button`s styled as text, **not** `Typography`. A clickable `Typography` is neither
keyboard-focusable nor announced as a control; a `Button` is both. Each opens the modal with its
own tab preselected.

### `components/follow/follow-dialog.tsx`

MUI `Dialog`. A persistent search field sits **above** the tabs:

- Empty query → the active tab (Following / Followers) shows its list.
- Non-empty query → the body swaps to global profile results.
- Clearing the query → returns to the tabs.

Each row: avatar, display name, `@username`, linking to `/u/[username]`, with a Follow/Unfollow
button on the right.

Row buttons are consistent across all three bodies (Following, Followers, search results) — the
button reflects the **viewer's** relationship to that row's profile, never the profile owner's.
Viewing someone else's Following list, a row you also follow reads "Following" and one you don't
reads "Follow". Two exceptions: the viewer's own row never shows a button, and a signed-out
viewer sees no row buttons at all.

Avatars use `LazyImage` at `size="sm"`, which picks up the edge-resized thumbnail path
automatically. Because `LazyImage` is `memo`'d, call sites pass **hoisted** `sx` objects and
fallback elements — an inline object literal silently defeats the memo (CLAUDE.md).

### Follow button

The existing `disabled` button on the card goes live. Optimistic via `useTransition` +
`notistack`, matching the obtained-toggle pattern. Signed-out visitors get a button routing to
`/login` rather than a dead control.

## Testing

Vitest, alongside `components/__tests__/`:

- Count buttons render real numbers and open the modal on the correct tab.
- Search debounce swaps the body to results; clearing restores the tabs.
- A row for the viewer's own profile renders no Follow button.
- `followUser` is idempotent — calling it twice leaves one row and reports success.
- Search escapes `,` `.` and `%` in the query rather than passing them into `.or()` raw.

RLS is **verified, not assumed** — a `with check` that silently passes is the failure mode worth
catching:

- An authenticated user cannot INSERT a row whose `follower_id` is someone else.
- A self-follow is rejected by `follows_no_self`.
- A signed-out client can SELECT follow rows (public read) but cannot INSERT.

## Migration

One file, `supabase/migrations/<timestamp>_add_follows_table.sql`: `pg_trgm`, the table, both
follow indexes, both search indexes, `enable row level security`, and the three policies.

Additive only — it creates a new table and adds indexes to `profiles`. It drops nothing and
alters no existing policy, so it needs no backfill and is safe to apply to production as-is.
