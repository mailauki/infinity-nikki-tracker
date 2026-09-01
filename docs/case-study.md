# Infinity Nikki Tracker — Case Study

A fan-made collection tracker for the game _Infinity Nikki_, built and shipped solo over seven months. It is a real production app with real users: public collection browsing, authenticated progress tracking, an admin CMS for the game data behind it, Stripe payments, and a feedback pipeline.

**Live:** [infinity-nikki-tracker.vercel.app](https://infinity-nikki-tracker.vercel.app/) · **Code:** [github.com/mailauki/infinity-nikki-tracker](https://github.com/mailauki/infinity-nikki-tracker)

---

## At a Glance

|                     |                                                                                                                                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Timeline**        | January 21 – August 13, 2026 (~7 months, ongoing)                                                                                                                                                               |
| **Team**            | Solo — design, frontend, backend, schema, ops                                                                                                                                                                   |
| **Scale**           | 513 commits · 312 merged PRs · ~47,000 lines across `app/`, `components/`, `hooks/`, `lib/`                                                                                                                     |
| **Data layer**      | 124 Postgres migrations · 31 tables + 1 aggregate view · RLS enabled on 21 tables across 74 policies · `security definer` RPCs for atomic toggles                                                               |
| **Stack**           | Next.js 16 (App Router, Server Components, Server Actions, Cache Components/PPR) · React 19 · TypeScript · Supabase (Postgres, Auth, Storage, RLS) · MUI v9 · Tailwind (layout only) · Stripe · Vitest · Vercel |
| **Domains tracked** | Outfits (+ Seasons, Evolutions) · Eureka (+ Trials) · Makeup · Momo's Cloaks · user-authored Custom Looks                                                                                                       |

---

## TL;DR

**What it is.** A production collection tracker for a game whose built-in UI can only answer "do I own this item?" — never "how complete am I, and what am I missing?" Five collection domains, browsable by guests, tracked by accounts, with an admin CMS behind it because someone has to enter thousands of rows and that someone is me.

**What's actually interesting about it.** Most of the notable engineering here is a **reversal** — a reasonable first architecture that met production and lost:

- **shadcn/ui → MUI** at five weeks in, once it was clear the app needed DataGrids, charts, and a real theming layer rather than components I'd own copies of.
- **Title-based FKs → slug-based FKs** with `ON UPDATE CASCADE`, so renaming game content stops breaking references. Paid off months later when new domains got slugs from day one.
- **Six client fetches → one bootstrap route**, with realtime _demoted_ rather than deleted — it still owns cross-device sync on obtained rows, which is what it's genuinely good at.
- **A Server Action that had to become a route handler.** Cookie-setting actions mark their response revalidated, which remounted the provider and refired a 6.7s fetch on every density toggle. Route handlers do the identical write without the revalidation.
- **Auth middleware from allow-list to deny-list**, after two public pages shipped redirecting guests to `/login` purely because nobody remembered to add them to the exception list.
- **An RLS policy using `FOR ALL`** let any authenticated user update their own `role` — self-promotion to admin. Fixed with split policies that assert the role is unchanged, comparing against the JWT claim to avoid recursive policy evaluation.

**Incidents worth reading.** PostgREST's 1000-row cap silently truncating large collections; the `/outfits` lag that profiling proved was re-render churn, not node count (so the plan explicitly _rejected_ virtualization as the first fix); CLS 0.42 from a drawer that read `localStorage` after hydration, fixed by moving the state to a cookie readable during SSR; a 5.5s auth round-trip in front of every page load; Vercel's image optimizer returning 402 once the quota ran out, breaking every thumbnail in production while dev worked fine.

**How it was built.** Solo, with Claude Code as a daily collaborator, across 312 PRs against a protected `main`. The leverage came from infrastructure rather than prompting: a `CLAUDE.md` operating manual where every entry exists because something broke once, formatter/typecheck hooks scoped to the edited file (~13s → ~1.1s per edit), 34 implementation plans and 35 design specs written before non-trivial work, and a `pre-push` hook that blocks pushes to already-merged branches — one that deliberately **fails open** when offline, because a guard that blocks work during an outage gets disabled permanently within a week.

**The habit that mattered most.** When a fix is non-obvious, the code carries the reason. Why `getUser()` beats the faster `getClaims()`. Why `await connection()` sits outside the try/catch. Which preference writes may live in a Server Action and which must not. In a codebase where one person is author, reviewer, and on-call, those comments are the only institutional memory there is.

**Honest gap:** test coverage arrived late and narrow — Vitest covers the feedback module, and the pure transforms in `hooks/` should have been tested from the start (§6).

---

## 1. The Problem

_Infinity Nikki_ is a dress-up adventure game with thousands of collectible clothing pieces spread across several unrelated collection systems. The game ships a built-in collection view, but it answers only one question — "do I own this specific item?" — and only while you're in the game.

What players actually ask is different:

- How complete is this set, overall?
- Which specific variants am I still missing?
- What's my progress across every collection system at once?
- Can I plan what to chase while I'm on the bus, not in the game?

That's a **completion and gap-analysis problem**, not a catalog problem — and it has to live outside the game to be useful. The tracker exists to answer "what am I missing" in one screen, across five collection domains, from any device.

### Design constraints that fell out of the problem

1. **Guests must see everything.** A tracker nobody can look at won't get shared. Every collection page is fully browsable logged-out; sign-in only adds persistence. This one decision shaped the auth architecture (see §4.4) and later caused a production bug worth its own section.
2. **Marking items has to be one tap, from anywhere.** Toggling obtained works from a grid card or a detail page, with instant optimistic feedback — the interaction happens hundreds of times per session while a player audits their wardrobe.
3. **The data model is not uniform.** Eureka items key on a `(set, category, color)` triple. Outfits add evolutions and seasons. Momo's Cloaks are flat entities with no variants at all. The UI had to feel like one product across five genuinely different shapes.
4. **Someone has to enter thousands of rows.** That "someone" is me, so the admin CMS is a first-class part of the product, not an afterthought.

---

## 2. Product Architecture

### Five domains, one mental model

The app presents every domain through the same three-layer idea — **set → variant → obtained** — even where the underlying shape differs:

| Domain        | Set layer                     | Variant layer                | Obtained key               |
| ------------- | ----------------------------- | ---------------------------- | -------------------------- |
| Eureka        | `eureka_sets` (style, rarity) | color × category grid        | `(set, category, color)`   |
| Outfits       | `outfit_sets` + evolutions    | pieces per category          | `(set, category, variant)` |
| Makeup        | `makeup_sets`                 | variants per category        | `(set, category, variant)` |
| Momo's Cloaks | — (flat)                      | —                            | `cloak slug`               |
| Custom Looks  | user-authored                 | mixed pieces from any domain | n/a                        |

Momo's Cloaks is the interesting one: it deliberately **doesn't** get the machinery. A cloak has no variants or evolutions to assemble, so its DB row is already the complete entity — no raw/resolved split, no variant-sync on save, no invariant validation. Copying the outfits pattern wholesale would have added three layers of abstraction to a table that needed none. Recognizing where a pattern _shouldn't_ apply saved more code than the pattern itself.

### Free, paid, and the line between them

Everything core is free: all collections, all filters, unlimited tracking, public profiles. A one-time Stripe supporter upgrade unlocks extra color themes, a custom profile banner, and unlimited Custom Looks (free accounts get 10).

The gate is enforced in three places, deliberately: the page redirects at the route level, the Server Action re-checks before writing, and the database has a `banner_url` premium-only policy at the RLS layer. Client-side gating is a UX affordance; the server check is the actual rule; RLS is the backstop if both are wrong.

Payment is a Stripe Checkout session plus a signature-verified webhook that flips `is_premium` using a service-role client. No subscription state machine, no billing portal — a one-time purchase is one row update, and modeling it as anything more would have been architecture for its own sake.

### Closing the loop: in-app feedback

Rather than route bug reports to GitHub issues (where players won't go), there's a feedback form reachable from the footer, plus a per-page "report this" link. The clever part is `entityFromPath()`: the report link derives _what you're reporting about_ from the URL alone — `/eureka/some-set` becomes `entity_type: 'eureka'`, `entity_slug: 'some-set'` — so no page needs per-page wiring, and unknown URL shapes degrade to nulls rather than failing. Reports land in an admin triage queue with image uploads.

---

## 3. Engineering Decisions

The interesting decisions in this project were mostly **reversals** — places where the first architecture was reasonable, met reality, and lost. Those are the ones documented here.

### 3.1 shadcn/ui → MUI (February 2026)

The project began from a Next.js starter with shadcn Blocks. Within five weeks I migrated the entire UI to MUI v9.

**Why:** the app is component-dense in a specific way — DataGrids with inline row editing, charts, drawers, filter toolbars, a theme system with light/dark plus user-selectable color presets. shadcn's copy-in-your-repo model means owning every one of those components. MUI ships them, and ships them with a coherent theming layer (CSS variables + `colorSchemes`) that I'd otherwise have hand-rolled.

**The cost:** Tailwind stayed, but demoted to layout utilities only. That's a rule the codebase enforces by convention rather than tooling, and it's the kind of thing that quietly rots without a written-down decision — which is exactly why it's written down.

**Residue:** SSR theme flicker. `InitColorSchemeScript attribute="class" defaultMode="system"` has to match the `ThemeProvider defaultMode` exactly or the page paints in the wrong scheme before hydration. Two separate commits went into getting this right.

### 3.2 Foreign keys on titles → foreign keys on slugs (March 2026)

The initial schema referenced lookup rows by their human-readable `title`. That works right up until a title changes — at which point either the rename cascades everywhere or the references break.

Migrating every FK to `slug` (with `ON UPDATE CASCADE`) took three PRs and taught two Postgres lessons the hard way:

- A foreign key on a non-primary-key column requires a `UNIQUE` constraint on the referenced column first.
- `ON UPDATE CASCADE` on string FKs is what makes renames survivable at all.

The migration paid off months later: when Momo's Cloaks was added in August, its FKs pointed at slugs from day one, explicitly to avoid repeating the title-vs-slug repair that the makeup tables had needed days earlier. A migration that fixes a class of bug is worth more than one that fixes an instance.

### 3.3 Six client fetches → one bootstrap endpoint (June 2026)

The Eureka page originally made ~6 client fetches on mount — sets, categories, colors, trials, styles, obtained — each its own route. They were consolidated into a single `/api/eureka/bootstrap` that `Promise.all`s React-`cache()`-deduped data hooks, letting four now-dead lookup routes be deleted.

Two subtleties in that route are worth calling out, because both were bugs before they were comments:

```ts
export async function GET() {
  // Reads auth cookies per request — defer to request time so PPR doesn't
  // prerender this route, where cookies() would reject at build. Kept OUTSIDE
  // try/catch so the prerender-abort signal propagates to React instead of
  // being swallowed and reported as a 500.
  await connection()
  ...
}
```

`await connection()` sits outside the `try` block on purpose. Next.js aborts prerendering by throwing a signal; catching it turns a correct build-time behavior into a mysterious 500. This is the kind of framework-level detail that only surfaces under Cache Components, and only in production builds.

The route is also **not auth-gated**: logged-out visitors get the public payload with `obtained: []`. Guests browsing freely (§1) meant the bootstrap couldn't assume a user.

### 3.4 Realtime, narrowed rather than removed

Early versions leaned on Supabase `postgres_changes` subscriptions as the primary data path. The current architecture uses a **client data-provider + context** model instead: the provider fetches its payload once from the bootstrap route, holds collection and filter state, and persists toggles through Server Actions with optimistic `useTransition` updates.

Realtime didn't get deleted — it got **demoted to what it's actually good at**. Each provider keeps one narrow subscription on the user's own `obtained_*` rows, filtered server-side to `user_id=eq.${userId}`, purely so a toggle on your phone shows up on your laptop:

```ts
// obtainedEureka is seeded from /api/eureka/bootstrap; this effect only owns
// the realtime subscription that keeps it in sync across tabs/devices.
```

The INSERT handler also reconciles against optimistic placeholder rows (`id === -1`) so a locally-toggled item doesn't briefly double up when the server echo arrives. That race — optimistic write vs. realtime echo — took two PRs to get right.

### 3.5 The Server Action that couldn't be a Server Action

This is my favorite bug in the project, because the correct fix looks wrong.

**Symptom:** every preference toggle on `/outfits` — changing density, sort order, image mode — triggered a full ~6.7s refetch of the page's data.

**Diagnosis:** a Server Action that sets cookies (which the Supabase SSR client does whenever it refreshes a session) marks its response as revalidated. That invalidates the client router cache, which remounts `OutfitDataProvider`, which refires its bootstrap fetch. The preference write was correct. Its _side effect on the router cache_ was the problem.

**Fix:** move exactly those writes out of Server Actions and into `POST /api/preferences`. A route handler performs the identical cookie write without triggering revalidation.

The nuance is that this is **not** a blanket rule — preference actions for settings, eureka, admin, and the theme switcher still live in `app/actions/preferences.ts`, because a provider remount on those pages is cheap. So the file opens with a comment explaining precisely which writes may live there and which must not:

```
// The outfit/sort-axis/density/image-mode actions that used to live in this
// file were deleted for exactly that reason. Do not add them back — if you
// need to persist a new outfits preference, call savePreferences({ ... }).
```

A rule with a stated boundary survives contact with future-me. A rule without one gets "cleaned up" in six weeks.

### 3.6 Auth middleware: from allow-list to deny-list

The session-refresh proxy originally gated **everything** and subtracted a growing list of public exceptions. Every new public domain was broken by default until someone remembered to add it — and two of them, `/makeup` and `/momo-cloaks`, shipped as public pages that redirected anonymous visitors to `/login` for exactly that reason.

Inverting it to a protected-list (`/admin`, `/profile`, `/settings`, `/looks`) changes the failure mode: forgetting to list a new _gated_ route is an explicit, visible omission, while forgetting a new _public_ route now does nothing at all. **Choose the default whose failure is the one you can afford.**

The same file carries a second decision that reads as an anti-optimization until you know the story: `getUser()` (a real network round-trip) is used instead of `getClaims()` (a local JWT decode), because `getClaims()` can silently return null when the cookie format doesn't match after a sign-out/sign-in cycle — logging users out at random. The slow, correct call won.

### 3.7 Security: the RLS policy that granted self-promotion

An early `profiles` policy used `FOR ALL`, which let any authenticated user `UPDATE` their own row — including the `role` column. Any user could make themselves an admin.

The fix splits it into separate `SELECT` and `UPDATE` policies, with the update policy asserting the role is unchanged. The non-obvious part is _how_ it asserts that: a sub-select against `profiles` inside a `WITH CHECK` on `profiles` risks infinite recursion in policy evaluation, so the comparison reads the JWT claim instead:

```sql
with check (
  (select auth.uid()) = id
  and role = (current_setting('request.jwt.claims', true)::jsonb ->> 'user_role')
);
```

Related hardening across the schema: `security definer` RPCs with `set search_path = ''` for atomic obtained-toggles, storage RLS policies scoping uploads per user, a WebP-only restriction on avatars, and a username charset constraint.

### 3.8 Structural conventions that kept a solo codebase navigable

- **Colocation rule.** A component whose entire consumer set lives under one route subtree is a flat file beside that route's `page.tsx`. `components/` holds only genuinely shared code — imported by 2+ unrelated routes, the root layout, or a global action. Promotion happens when a second route imports it, never speculatively.
- **Config-driven admin forms.** After hand-writing several near-identical CRUD forms, they were collapsed into an `EntityForm` engine. Admin CRUD across five domains is now mostly configuration.
- **Two caching primitives, one rule.** Public lookups use `use cache` + `cacheLife` with a cookie-free Supabase client; anything reading `cookies()` must use React `cache()`, because `cookies()` is blocked inside `use cache`. React `cache()` is reads-only — wrapping a mutation in it makes repeated calls with identical args silently no-op.

---

## 4. Performance & Incidents

Each of these started as an observed symptom in production, not a hunch.

### 4.1 PostgREST's 1000-row cap silently truncated collections

**Symptom:** users with large collections saw wrong progress counts and toggles that didn't stick.

**Cause:** PostgREST caps a single response at 1000 rows. An unbounded `select` on `obtained_eureka` or `obtained_outfit` silently drops everything past the first page — no error, just missing data. A dedicated tracker is precisely the app where users cross 1000 rows.

**Fix:** a shared `fetchAllRows()` helper that pages with `.range()` until a short page signals the end, adopted by every collection hook — including new domains from day one.

This is my go-to example of a bug class that testing rarely catches: it needs a large-collection account to reproduce, and every layer above it looks correct.

### 4.2 O(sets × variants × obtained) on every render

Deriving each variant's `obtained` flag ran a linear `.find()` over the obtained array — around 6,000 scans per set, per render. Replaced with a `Set` keyed on `{set}-{category}-{color}`, built once per data change and consulted in O(1) (`buildObtainedKeySet` / `isVariantObtained` / `applyObtainedKeys`).

### 4.3 The `/outfits` grid: diagnose before you reach for virtualization

**Symptom:** the outfits page lagged badly.

The obvious fix was virtualization. Profiling said otherwise — the lag was **re-render churn, not DOM node count**, and it reproduced at only a few hundred cards. So the design doc explicitly _rejected_ virtualization as the first fix and specified three things instead: memoize the provider context, memoize and de-nest the ~100-line filter/sort pipeline (previously re-running on every render), and memoize the cards with stable callbacks.

Field testing during that work surfaced a fourth, distinct problem: applying a filter _blocked_ the page — you couldn't apply a second filter until the ~6,000-card render finished. That's not a wasted-render problem, it's an urgent `setFilters` call React can't interrupt, and it needed a transition, not a memo.

The filter pipeline refactor was verified by capturing output snapshots across six filter states and proving them byte-identical before and after — the check that lets you refactor a pipeline that has no test coverage without shipping a silent behavior change.

### 4.4 Core Web Vitals: CLS 0.42, LCP 4.56s

Speed Insights reported a poor real-experience score (33). TTFB was fine at 0.17s, so the problem was entirely front-end paint and shift.

**CLS (0.42):** the nav drawer initialized closed, then a `useEffect` read `localStorage` and re-opened it after hydration. On tablet and up the drawer pushes content, so its width jumped ~80px → 240px post-mount and shoved the entire main column. Fixed by persisting drawer state in a **cookie** instead and seeding the provider server-side — so the drawer renders at its final width on first paint. Verified by confirming the SSR HTML now differs by cookie value.

**LCP (4.56s):** the homepage hero served a 2560×1440 JPEG (~347 KB) into a 240px-tall slot. Replaced with a 1400w WebP (~107 KB, −69%), marked `fetchPriority="high"`, and preloaded via `ReactDOM.preload` so it downloads during HTML parse.

The `localStorage` → cookie swap is the generalizable lesson: **any state that affects first paint has to be readable on the server.** `localStorage` is structurally incapable of that, so every use of it for layout state is a CLS bug waiting to be measured.

### 4.5 A 5.5-second auth check in front of every page load

**Symptom:**

```
GET /admin/makeup/sets/new 200 in 6.8s (proxy.ts: 5.5s, application-code: 1357ms)
```

**Cause:** `supabase.auth.getUser()` is a real network call to the Supabase auth endpoint — measured at 200–800ms warm and multiple seconds cold — and it ran on **every** matched request, including anonymous visitors to public pages who have no session to validate.

**Fix:** skip the round-trip only when a request is for a public route **and** carries no Supabase auth cookie. That cookie check is what makes it safe: a logged-in user on a public page still goes through `getUser()`, because public pages read the user to show progress, and because `getUser()` is what refreshes an expiring token. Short-circuiting them would let sessions lapse mid-browse. The route matcher was deliberately left untouched for the same reason.

Anonymous requests — the ones with nothing to refresh — skip a round-trip that was pure latency. This shipped alongside the allow-list → deny-list inversion in §3.6, since both live in the same file and the same misunderstanding produced both.

### 4.6 The image optimizer that started returning 402

**Symptom:** every variant thumbnail broke in production while the source files served fine (200) from Supabase — and everything worked perfectly in `yarn dev`.

**Cause:** Vercel's image optimizer (`/_next/image`) returns `402 OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED` once the plan's optimization quota is exhausted. Dev optimizes locally with no billing gate, which is why it was invisible until production.

**Fix:** `images.unoptimized: true`, so `next/image` emits a plain `<img>` pointing at the original Supabase URL — the path already proven to return 200. The trade-off is explicit and documented: no AVIF/WebP conversion, no `srcset`, acceptable for ~40 KB CDN PNGs. The `optimized` prop on the eureka cards became a deliberate no-op rather than being ripped out of every call site.

The follow-on decision was to move optimization **upstream**: uploads are now re-encoded to WebP before storage, so images arrive small instead of being shrunk on delivery.

### 4.7 A performance fix that had to be partly reverted

Worth including because it went wrong in a specific, instructive way. The bootstrap-consolidation PR also converted public lookup hooks to `use cache` + a cookie-free client. That broke the Vercel build: `use cache` forced those hooks to run during build-time prerender, where `NEXT_PUBLIC_SUPABASE_*` env vars are absent, crashing with "Your project's URL and Key are required."

The conversion was reverted to React `cache()` within the same PR, leaving the bootstrap consolidation, the 1000-row fix, and the `Set`-based derivation intact — then verified by building with Supabase env unset, simulating the Vercel prerender worker. Splitting the revert to exactly the broken change, and reproducing the CI environment locally, is what kept a genuinely valuable PR from being thrown away over one bad hunk.

---

## 5. Working Solo with an AI Pair

This project was built with Claude Code as a daily collaborator, and the workflow around that turned out to be as much of a design problem as the app itself. The short version: **the leverage came from infrastructure, not prompting.**

### Written-down context beats re-explaining

`CLAUDE.md` is the project's operating manual — architecture, conventions, and a growing list of hard-won gotchas (the `cache()`-on-mutations trap, the MUI `Stack` shorthand TypeScript error, the `useColorScheme()`-not-`useTheme()` rule for CSS-variables mode, `git add` needing quotes around `[slug]` paths in zsh). Every entry is there because something broke once. It's the difference between an assistant that knows this codebase and one that knows Next.js in general.

### Automation at the tool boundary

`.claude/settings.json` wires hooks into the edit loop:

- **PostToolUse:** Prettier + ESLint `--fix` on **just the edited file**, plus a project-wide `tsc --noEmit` marked async so it reports without blocking. The scoping matters — the original version ran `prettier --write .` across 488 files on every single edit (~13s each); scoping it to the edited file brought that to ~1.1s.
- **PreToolUse:** hard block on edits to any `.env` file.

Repeatable procedures became **skills** (`git-workflow`, `new-data-hook`, `merge-pr`) and a specialist **subagent** (`a11y-reviewer`, auditing MUI components against WCAG 2.1 AA). A skill is just a decision written down once so it doesn't have to be re-litigated per session.

### Plan first, on anything non-trivial

`docs/` holds 34 implementation plans and 35 design specs. The outfits performance work is the clearest example of why: the design doc profiled first, **rejected the obvious fix** (virtualization) with evidence, and specified the real one; the implementation plan then split the work so a no-logic-change memo wrapper landed separately from an O(n²) de-nesting, each verified against a six-state output snapshot. Planning is what let a risky refactor ship in reviewable pieces.

### Guardrails in git, not in discipline

`main` is protected — PR plus one approving review plus a Vercel status check, force-push and deletion blocked. Every one of the 312 PRs went through it.

Beyond that, one failure mode got its own tooling. A squash-merge only captures the commits that existed at merge time, so pushing to an already-merged branch silently strands work outside `main`. A tracked `pre-push` hook queries the PR state and blocks the push — and it **fails open** if the GitHub CLI is missing or offline, because a guard that blocks work when your network is down gets disabled permanently within a week. A companion cleanup script deletes merged local branches only after `git cherry` confirms nothing is stranded.

### Comments as decision records

The habit that made the biggest difference: **when a fix is non-obvious, the code carries the reason.** The proxy explains why `getUser()` beats the faster `getClaims()`. The bootstrap route explains why `await connection()` sits outside the try/catch. The preferences file explains which writes may live there and which must not. The rate limiter explains why the IP-salt check can't run at module load — Next.js imports route modules during build's page-data collection, so a throw at import time takes down the build itself rather than a misconfigured deploy.

Those comments are what let an AI collaborator (and future-me) make correct changes without rediscovering the bug. In a codebase where the same person is author, reviewer, and on-call, they're the only institutional memory there is.

---

## 6. What I'd Do Differently

- **Test coverage arrived late and narrow.** Vitest covers the feedback module — validation, rate limiting, path-to-entity derivation, and its components. The rest of the app has none, which is why the outfits refactor had to lean on manual six-state output snapshots. The pure transform functions in `hooks/` are trivially testable and should have been tested from the start.
- **Schema-first, not UI-first.** The title→slug FK migration and the makeup slug normalization were both retroactive repairs. Both were predictable at design time; neither was designed for.
- **Production-only failure modes need production-shaped checks.** The image-optimizer 402 and the `use cache` build crash both worked perfectly in dev. A staging check that runs the build with production-ish env would have caught the second one before CI did.
- **Measure before optimizing — but also measure before _not_ optimizing.** The `/outfits` lag was misdiagnosed as a node-count problem for a while. Profiling reframed it in one session.

## 7. What's Next

Search across sets and variants, tracking for outfit pieces that belong to no set, favorites, friends for comparing progress, and shareable links for Custom Looks.

---

_Infinity Nikki Tracker is a fan-made project and is not affiliated with, endorsed by, or connected to Papergames or the Infinity Nikki development team._
