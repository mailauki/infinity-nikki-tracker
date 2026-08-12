# Feedback System Design

**Date:** 2026-08-11
**Status:** Approved

## Problem

The help page offers "Feature request" and "Report an issue" dialogs. Both are backed by
`app/help/feature-request-form.tsx` and `app/help/bug-report-form.tsx`, which are byte-for-byte
identical except for their `CATEGORIES` array. Both submit by building a `mailto:` URL and
assigning `window.location.href`.

Three problems follow from that:

1. **Screenshots don't work.** A `mailto:` URL cannot carry attachments. The forms present a file
   picker, collect `File[]` into state, render filename chips — and then discard them, showing an
   Alert reading "Your email app has opened — attach your screenshots before sending!" The picker
   is decoration that asks the user to redo the work manually.
2. **Nothing is stored.** Submissions live only in an inbox. There is no status, no history, no way
   to see what has already been reported.
3. **Reports lack context.** A user who finds a broken image on one eureka set must describe which
   page and which item in prose, from memory, after navigating away to the help page.

## Goals

- Replace the `mailto:` path with real persistence in Supabase, including working image uploads.
- Collapse the two duplicate forms into one shared component.
- Let users report a problem from the page it occurs on, with route and entity captured
  automatically.
- Give the maintainer an in-app triage surface consistent with the existing admin dashboard.
- Confirm receipt to the submitter, both in-app and by email, showing what they sent.

## Non-Goals

Explicitly out of scope for this pass:

- User-facing submission history ("my reports" view).
- Reply threads / back-and-forth support ticketing.
- Notifying the **maintainer** by email on new submissions. (The submitter receipt is in scope;
  maintainer alerting is not. Once Resend is wired up, adding it later is small.)

Each is deferrable without reworking what this design builds. The `status` and `admin_notes`
columns exist from the start so a history view can be added later without a migration.

## Data Model

### `feedback`

| Column            | Type                                   | Notes                                                            |
| ----------------- | -------------------------------------- | ---------------------------------------------------------------- |
| `id`              | `uuid` PK, default `gen_random_uuid()` |                                                                  |
| `type`            | `text NOT NULL`                        | CHECK IN (`'feature'`, `'issue'`)                                |
| `category`        | `text NOT NULL`                        | Per-type dropdown value                                          |
| `title`           | `text NOT NULL`                        | CHECK length 1–200                                               |
| `description`     | `text NOT NULL`                        | CHECK length 1–5000                                              |
| `email`           | `text`                                 | Nullable; receipt recipient (see Receipt)                        |
| `receipt_sent_at` | `timestamptz`                          | Nullable; set when the provider accepts the receipt for delivery |
| `user_id`         | `uuid`                                 | Nullable FK → `auth.users(id)` ON DELETE SET NULL                |
| `page_path`       | `text`                                 | Nullable; auto-captured route                                    |
| `entity_type`     | `text`                                 | Nullable; e.g. `'eureka'`, `'outfits'`, `'makeup'`               |
| `entity_slug`     | `text`                                 | Nullable; e.g. `'blossoming_dream'`                              |
| `entity_title`    | `text`                                 | Nullable; human-readable name when the page supplies one         |
| `user_agent`      | `text`                                 | Nullable; repro info                                             |
| `status`          | `text NOT NULL DEFAULT 'new'`          | CHECK IN (`'new'`, `'in_progress'`, `'resolved'`, `'declined'`)  |
| `admin_notes`     | `text`                                 | Nullable; maintainer triage notes                                |
| `created_at`      | `timestamptz NOT NULL DEFAULT now()`   |                                                                  |
| `updated_at`      | `timestamptz NOT NULL DEFAULT now()`   |                                                                  |

Indexes: `(status, created_at DESC)` for the default admin view; `(type)` for filtering.

`user_id` is `ON DELETE SET NULL` rather than `CASCADE` — a bug report stays useful after the
reporter deletes their account, and the report is not the user's personal data in the way their
collection is.

### `feedback_images`

| Column        | Type                                 | Notes                                 |
| ------------- | ------------------------------------ | ------------------------------------- |
| `id`          | `uuid` PK                            |                                       |
| `feedback_id` | `uuid NOT NULL`                      | FK → `feedback(id)` ON DELETE CASCADE |
| `path`        | `text NOT NULL`                      | Storage object path                   |
| `created_at`  | `timestamptz NOT NULL DEFAULT now()` |                                       |

A child table rather than a `text[]` column on `feedback`: deleting a report cascades its image
rows, and adding per-image metadata later (width, size, caption) doesn't require rewriting an
array column.

### RLS

No client-side insert path exists at all. Both anonymous and authenticated submissions go through
the API route, so there is exactly one write path to validate and rate-limit rather than two
diverging ones.

- `feedback`: SELECT and UPDATE for admins only, via the existing `is_admin` RPC. No INSERT policy
  for any client role.
- `feedback_images`: SELECT for admins only. No client INSERT.
- The API route uses `SUPABASE_SERVICE_ROLE_KEY`, bypassing RLS.

### Storage

A new **private** `feedback` bucket — not the existing public `images` bucket. Screenshots may show
a user's account, collection, or email address, and must not be world-readable by URL. Admin views
read them through short-lived signed URLs.

Object path: `{feedback_id}/{index}.webp`.

## Submission Path

A single route handler at `app/api/feedback/route.ts` handling `POST`.

Order of operations:

1. `await connection()` **before** reading anything request-scoped, and **outside** the try/catch,
   so the prerender-abort signal propagates to React rather than being swallowed as a 500. (Per the
   API-route rule in `CLAUDE.md`.)
2. Parse `multipart/form-data`: text fields plus up to 3 image files.
3. **Rate limit by IP.** See below.
4. **Validate:**
   - `title`, `description` present and within length caps
   - `type` and `category` are known values (allowlist, not free text)
   - at most 3 files, each ≤ 5 MB
   - each file's MIME sniffed from its actual bytes, not the client-supplied `Content-Type`
5. **Re-encode each image server-side with `sharp` to WebP.** This does three jobs at once:
   normalizes format to match the app's existing WebP convention; strips EXIF metadata, which
   routinely carries GPS coordinates on phone screenshots; and neutralizes a malicious payload
   disguised as an image, since the output is a freshly-encoded file rather than the uploaded bytes.
   Also cap dimensions (e.g. max 2000px on the long edge) to bound storage.
6. Insert the `feedback` row, upload the images to `feedback/{id}/{n}.webp`, insert
   `feedback_images` rows.
7. Send the receipt email if an address is available (see Receipt), non-blocking.
8. Return `201` on success, echoing back the stored submission so the form can render the in-app
   receipt from server-confirmed data rather than local state.

**Partial-failure rule.** The text of a report is the valuable part; the screenshots are
supporting evidence. So the `feedback` row is inserted first and is never rolled back for an
image failure. If an upload or `feedback_images` insert fails, the route still returns `201`
with a flag indicating some attachments failed, and the form tells the user their report was
received but a screenshot didn't attach. A report that arrives without its screenshot is a far
better outcome than a report silently lost because one upload timed out. Failed uploads are
logged server-side; any objects written before the failure are best-effort removed so the bucket
does not accumulate files no row references.

`sharp` is a new dependency. It is the standard Next.js image library and runs on Fluid Compute
without special configuration. The alternative — reusing the existing browser-side `fileToWebp`
(`lib/image-to-webp.ts`, canvas-based, so it cannot run server-side) — was rejected because
client-side re-encoding is trivially bypassed by posting directly to the endpoint, meaning the
server would need this validation anyway.

### Rate Limiting

Anonymous submission makes this a public, unauthenticated write endpoint that accepts binary
uploads. It needs a real limit.

**5 submissions per IP per hour.** Generous for a genuine reporter; useless for a spammer.

Implemented with a `feedback_rate_limit` table (`ip_hash`, `window_start`, `count`), **not** an
in-memory counter. Fluid Compute reuses function instances unpredictably across requests, so an
in-memory map silently under-counts whenever a request lands on a fresh instance — it would appear
to work in testing and fail in production.

The IP (from `x-forwarded-for`) is stored **hashed with a server-side secret**, not raw, so the
table does not accumulate a log of visitor IP addresses. A scheduled cleanup (or opportunistic
delete of expired windows on write) keeps the table small.

On limit exceeded: return `429` with a message the form renders inline.

## Receipt

Every submitter gets confirmation of what they sent, in two forms.

### In-app receipt

On success the dialog switches to a receipt view showing the full submission: type, category,
title, description, page context (when present), and the names of any attached screenshots. The
form already holds all of this at submit time, so it costs almost nothing to render.

This is deliberately the primary receipt, not a fallback. It works with no email address, no
provider, and no delivery risk — and it is the **only** receipt an anonymous user who skips the
email field will ever get.

### Email receipt

Sent when an address is available:

- **Logged-in users:** automatically, to their account email. They type nothing.
- **Anonymous users:** only if they fill in the email field, which is relabeled from "Your email
  (optional)" to "Email (optional — we'll send you a copy)" so the field's purpose is explicit.

Nobody is required to supply an address to report a problem. Requiring one would add friction to
exactly the drive-by report this feature exists to capture, and would mostly harvest fake
addresses.

The email restates the same content as the in-app receipt, plus a note that the report was
received and that there may not be an individual reply.

**Screenshots are listed by filename only** — "2 screenshots attached: screenshot-1.webp,
screenshot-2.webp" — and are neither embedded nor attached. Embedding would require signed URLs
long-lived enough to survive an email opened weeks later, putting durable links to private-bucket
images into an inbox and through a third-party provider. The user already knows what they sent;
the filenames are enough to confirm the upload registered.

### Provider

**Resend, installed via the Vercel Marketplace** (`vercel integration add resend`), so env vars are
wired automatically and billing stays unified.

Two caveats for implementation:

- The installed Vercel CLI is **v50**, which has no `integration discover` subcommand, so the live
  marketplace catalog could not be enumerated while writing this spec. Upgrade the CLI
  (`npm i -g vercel@latest`) and confirm Resend is in the catalog before installing; fall back to
  a direct resend.com signup with a `RESEND_API_KEY` env var if it is not.
- **A verified sending domain is required.** Resend will not send to arbitrary recipients from an
  unverified domain, and verification is a manual DNS step in their dashboard that cannot be
  automated from here. This blocks the email receipt only — the in-app receipt is unaffected, so
  the feature ships useful without it.

### Failure handling

The receipt send follows the same partial-failure rule as image uploads: it happens **after** the
`feedback` row is committed, inside the same request, and a failure **never** fails the submission.
A confirmation email is not worth losing a bug report over.

On success, stamp `receipt_sent_at`. On failure, log server-side and leave it null — the admin view
can then show which submissions never got a receipt. The user still sees the in-app receipt either
way, so a send failure is invisible to them and harmless.

No queue, no retry loop, no DB webhook. Those add a second deployment surface and more failure
modes than a confirmation email justifies.

## Forms

One shared component, `components/feedback/feedback-form.tsx`, taking:

```ts
type FeedbackType = 'feature' | 'issue'

interface FeedbackFormProps {
  type: FeedbackType
  context?: ReportContext // route/entity, when opened from a page
  onClose: () => void
}
```

`type` selects the category options, dialog copy, and submit label. It lives in `components/`
rather than colocated in `app/help/` because it has two unrelated consumers — the help page and the
global footer — which is exactly the promotion rule in `CLAUDE.md`.

Both `app/help/feature-request-form.tsx` and `app/help/bug-report-form.tsx` are **deleted**, along
with the entire `mailto:` path, the `showReminder` Alert, and the "Attach these to your email after
clicking Send" caption.

Redesign changes beyond the rewiring:

- **Real uploads** with thumbnail previews and per-file remove, replacing bare filename chips.
- **Inline per-field validation** with messages, replacing a blanket `disabled` submit button that
  never explains what's missing.
- **Pending state** via `useTransition`, a success state that renders the in-app receipt (see
  Receipt), and a retry-able error state.
- **Email field repurposed** as the receipt recipient. Hidden entirely for logged-in users, whose
  account address is used automatically; shown to anonymous users labeled "Email (optional — we'll
  send you a copy)".
- **No `mailto:` fallback on failure.** Errors show a retry affordance. Keeping the fallback would
  mean maintaining the broken screenshot flow indefinitely; the maintainer's email is already
  listed elsewhere on the help page for anyone truly stuck.
- **Captured context shown, not hidden.** A line reading `Reporting about: Eureka › Blossoming
Dream` appears above the fields whenever context is present, so users can see what they are
  sending. Users are never surprised by metadata they didn't know was attached.

Accessibility: the dialog needs focus management on open/close, inputs associated with labels,
validation errors linked via `aria-describedby`, and the upload control operable by keyboard.
Run the `a11y-reviewer` subagent over the finished component.

## Per-Page Report Entry Point

Mounted in `components/navbar/nav-footer.tsx`, which is already `'use client'` and already rendered
globally by `layout-shell.tsx`.

**Why the footer rather than a `PageShell` prop.** An audit of all 66 `page.tsx` files found that
every user-facing page already renders `PageShell`, either directly (20 pages) or one level down
through a detail/builder component (`*-detail.tsx`, `look-builder.tsx`). The three apparent
exceptions are false positives: `looks/new` and `looks/edit/[slug]` both render `LookBuilder`,
which uses `PageShell` internally, and `app/profile/page.tsx` renders no UI at all — it is a pure
redirect to `/u/[username]`.

So a `PageShell` prop would work, but it would mean touching ~20 files and relying on every future
page remembering to pass it. The footer needs **one** change, covers every page including
admin and auth routes, and cannot develop coverage gaps as pages are added.

**No retrofit of `PageShell` onto those 3 pages** — there is no gap to close. Adding it would
double-wrap two layouts and wrap a redirect.

### Context capture

`<ReportIssueLink>` is a client component. It derives context itself:

- **Route:** `usePathname()`.
- **Entity:** parsed from the pathname. `/eureka/blossoming_dream` yields
  `entity_type: 'eureka'`, `entity_slug: 'blossoming_dream'`. A small parser maps the known
  route shapes; unknown routes simply yield no entity, which is valid.
- **Display title:** an optional React context (`ReportContextProvider`). Detail pages that already
  have the entity's title in scope publish it; everything else falls back to the parsed slug. Being
  optional, no page breaks by not providing it, and it can be added page-by-page after the fact.
- **User agent:** `navigator.userAgent`.

The link reads "Report a problem with this page", styled as a quiet footer action consistent with
the existing `CoffeeButton` / `ThemeSwitcher` row. It opens the shared form with `type="issue"` and
the captured context.

The help page keeps its two clearly-labeled entry points, both opening the same shared component
with different `type` values.

## Admin Triage

`/admin/feedback`, following the established admin pattern exactly:

- Server Component page that `Promise.all`s its data hooks inside a `Suspense` boundary, passing
  plain rows to a colocated `'use client'` `feedback-view.tsx` that owns the `GridColDef[]`.
- `@mui/x-data-grid` with inline row editing for `status` and `admin_notes`, using the shared
  `useRowActions()` helper from `app/admin/eureka/table-utils.tsx`.
- `LockedCell` links to a detail route showing the full description and the attached screenshots,
  loaded via signed URLs from the private bucket.
- Default filter: `status = 'new'`.
- Columns: created date, type, category, title, page path, entity, status.
- A nav entry added to `admin-nav-menu.tsx`.

Data hooks go in `hooks/data/admin/feedback.ts` using React `cache()` — **not** `use cache`, since
these reads are auth-dependent and call `cookies()`. Status/notes mutations must **not** be wrapped
in `cache()`.

## Implementation Order

1. Migration: `feedback`, `feedback_images`, `feedback_rate_limit`, RLS policies, private storage
   bucket. Regenerate `lib/types/supabase.ts`.
2. `POST /api/feedback` with validation, rate limiting, `sharp` re-encoding, and uploads.
3. Shared `feedback-form.tsx` including the in-app receipt success state; delete the two old forms;
   rewire the help page.
4. `ReportIssueLink` + pathname parser + optional context provider; mount in `nav-footer`.
5. Admin `/admin/feedback` list, detail view, and nav entry.
6. Email receipt: upgrade the Vercel CLI, confirm and install Resend, verify the sending domain,
   add the template and the non-blocking send.
7. `a11y-reviewer` pass over the new dialog and footer link.

Steps 1–3 are independently shippable and deliver the core value (working storage, uploads, and a
receipt users can see). Steps 4 and 5 build on them.

Step 6 is deliberately **last**: it is the only step gated on an external account and a manual DNS
verification, and the in-app receipt from step 3 means the feature is genuinely useful before it
lands. Nothing earlier depends on it.

## Risks

- **`sharp` on the deployment target.** Standard for Next.js and supported on Fluid Compute, but
  verify the production build before relying on it.
- **Anonymous abuse.** Rate limiting plus size/count caps is the mitigation. If spam appears in
  practice, Vercel BotID can be layered onto the route without schema changes.
- **Storage growth.** Bounded by the 3-image / 5 MB caps, dimension capping, and WebP re-encoding.
  Deleting a `feedback` row cascades its image rows, but storage objects need explicit cleanup —
  worth a note in the admin delete path.
- **Receipts to unverified addresses.** Anonymous users type an address that is never confirmed, so
  a typo (or someone else's address) receives a copy of a report. Impact is low — the content is
  what that sender just wrote — but it argues against ever including anything sensitive in the
  receipt, which is a further reason the screenshots are listed by name rather than embedded.
- **Sending reputation.** A public form that emails arbitrary typed addresses is a spam-complaint
  vector. Resend's defaults plus the rate limit cover this at expected volume; if complaints appear,
  the fallback is restricting receipts to authenticated users, which needs no schema change.
