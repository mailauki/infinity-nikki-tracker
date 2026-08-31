# OAuth Login & Account Linking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google and Discord sign-in alongside the existing email/password login, with bidirectional account linking so one account can hold several sign-in methods.

**Architecture:** Supabase's `auth.identities` table already models "one user, many identities" — no new tables. The work is: a PKCE callback route (the app has none today), OAuth buttons on login/sign-up, a Connected accounts section in settings that calls `linkIdentity`/`unlinkIdentity`, a lockout guard backed by a server-side password check, and one migration that populates `profiles` from provider metadata.

**Tech Stack:** Next.js 16 App Router, `@supabase/ssr`, `@supabase/supabase-js` v2, MUI v9, Vitest + Testing Library, Supabase CLI 2.116.0.

**Spec:** `docs/superpowers/specs/2026-08-30-oauth-account-linking-design.md`

## Global Constraints

- **Package manager is Yarn.** Never `npm` or `pnpm`. Tests run with `yarn test` (`vitest run`).
- **Prettier style: no semicolons, single quotes, 2-space indent, 100 char width, ES5 trailing commas.** A PostToolUse hook runs `prettier --write` + `eslint --fix` on each edited file automatically — do not fight it.
- **Never push to `main`.** It is protected. Work happens on branch `feat/oauth-account-linking`, which already exists and already carries the spec commit.
- **Typography:** MUI's built-in variants are removed. Use `variant` (`display`/`headline`/`title`/`body`/`label`) + `size` (`large`/`medium`/`small`). `variant="h6"` or `variant="body1"` is a build error. Every variant renders a `<span>`; pass `component="h2"` etc. for real headings.
- **MUI `Stack` does not accept layout shorthands as direct props.** `justifyContent`, `alignItems` and friends go in `sx` or you get a TypeScript build error.
- **Path alias `@/` maps to the project root.**
- **Do not edit `.env.local`** — a PreToolUse hook blocks it. Secrets are the maintainer's job.
- **Type-check with `yarn tsc --noEmit`**, never `yarn dlx tsc` (fetches a bogus placeholder package).
- **`getUserID()` returns `null` for logged-out users** — always guard before using it in a user-scoped query.
- Supabase project ref: `ykfuevyqpjvtxidjnhxm`. Provider callback URL: `https://ykfuevyqpjvtxidjnhxm.supabase.co/auth/v1/callback`.

## File Structure

**Create:**

- `app/(auth)/auth/callback/route.ts` — PKCE code exchange; serves both sign-in and link flows.
- `lib/auth-redirect.ts` — `safeNext()` open-redirect guard. Separate from the route so it is testable without invoking a route handler.
- `lib/__tests__/auth-redirect.test.ts`
- `lib/identity-guard.ts` — `removableProviders()` pure predicate for the unlink lockout rule.
- `lib/__tests__/identity-guard.test.ts`
- `components/oauth-buttons.tsx` — shared by login and sign-up (two unrelated routes ⇒ `components/`, per the colocation rule).
- `components/discord-icon.tsx` — inline SVG; MUI Icons has no Discord mark and Lucide dropped brand icons.
- `app/settings/connected-accounts.tsx` — colocated, single-route.
- `supabase/migrations/20260830120000_oauth_profile_metadata.sql`

**Modify:**

- `app/(auth)/login/login-form.tsx` — add `<OAuthButtons />` + divider.
- `app/(auth)/sign-up/sign-up-form.tsx` — same.
- `app/(auth)/sign-up-success/page.tsx` — anti-enumeration copy softening.
- `app/settings/account-settings.tsx` — mount `ConnectedAccounts`; make password section copy conditional.
- `app/settings/actions.ts` — add `getHasPassword()` Server Action.
- `supabase/config.toml` — `enable_confirmations`, `enable_manual_linking`, google + discord blocks.
- `CLAUDE.md` — env vars, `yarn test` in the command list.

**Task order rationale:** Tasks 1–2 are pure functions with no dependencies, so they land tested first. Task 3 (callback route) consumes Task 1. Task 4 (migration + config) is independent and unblocks manual testing. Tasks 5–6 (UI) consume Tasks 2–3. Task 7 is docs.

---

### Task 1: `safeNext` redirect guard

**Files:**

- Create: `lib/auth-redirect.ts`
- Test: `lib/__tests__/auth-redirect.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: `safeNext(value: string | null): string` — returns `value` when it is a same-site absolute path, otherwise `'/'`.

Why this exists as its own file: `?next=//evil.com` interpolated into a redirect produces a protocol-relative URL the browser follows off-site. `app/(auth)/auth/confirm/route.ts` already guards this inline; extracting it means the callback route cannot disagree with it, and the rule gets a test.

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/auth-redirect.test.ts
import { describe, expect, it } from 'vitest'
import { safeNext } from '../auth-redirect'

describe('safeNext', () => {
  it('accepts a same-site absolute path', () => {
    expect(safeNext('/settings')).toBe('/settings')
    expect(safeNext('/u/someone')).toBe('/u/someone')
  })

  it('accepts a path with a query string', () => {
    expect(safeNext('/settings?tab=account')).toBe('/settings?tab=account')
  })

  // The one that matters: '//evil.com' is protocol-relative, so a browser
  // treats it as an absolute off-site URL despite the leading slash.
  it('rejects a protocol-relative URL', () => {
    expect(safeNext('//evil.com')).toBe('/')
    expect(safeNext('//evil.com/path')).toBe('/')
  })

  it('rejects an absolute URL', () => {
    expect(safeNext('https://evil.com')).toBe('/')
    expect(safeNext('http://evil.com')).toBe('/')
  })

  it('rejects a relative path with no leading slash', () => {
    expect(safeNext('settings')).toBe('/')
  })

  it('falls back to / for null or empty input', () => {
    expect(safeNext(null)).toBe('/')
    expect(safeNext('')).toBe('/')
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `yarn test lib/__tests__/auth-redirect.test.ts`
Expected: FAIL — cannot resolve `../auth-redirect`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/auth-redirect.ts

// Validates a `next` redirect parameter. Only a same-site absolute path is
// allowed through; everything else falls back to the site root.
//
// The '//' check is the point of this function. A leading '//' makes the
// value protocol-relative ('//evil.com' resolves to 'https://evil.com'), so
// a bare startsWith('/') test would wave an off-site redirect straight
// through.
export function safeNext(value: string | null): string {
  if (!value) return '/'
  if (!value.startsWith('/')) return '/'
  if (value.startsWith('//')) return '/'
  return value
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `yarn test lib/__tests__/auth-redirect.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/auth-redirect.ts lib/__tests__/auth-redirect.test.ts
git commit -m "feat(auth): add safeNext redirect guard"
```

---

### Task 2: Unlink lockout guard

**Files:**

- Create: `lib/identity-guard.ts`
- Test: `lib/__tests__/identity-guard.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces:
  - `type IdentitySummary = { provider: string }`
  - `removableProviders(identities: IdentitySummary[], hasPassword: boolean): Set<string>`

The rule: a provider is removable only if removing it leaves at least one usable sign-in method. An `email` identity counts as usable **only when a password is actually set** — an auto-linked OAuth user can own an `email` identity with no password behind it, and treating that as usable is precisely how someone gets locked out of their own account.

Supabase's own API only enforces "≥2 identities remain", which is weaker than this rule and would happily strand such a user.

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/identity-guard.test.ts
import { describe, expect, it } from 'vitest'
import { removableProviders } from '../identity-guard'

const email = { provider: 'email' }
const google = { provider: 'google' }
const discord = { provider: 'discord' }

describe('removableProviders', () => {
  it('never allows removing a lone identity', () => {
    expect(removableProviders([email], true)).toEqual(new Set())
    expect(removableProviders([google], false)).toEqual(new Set())
  })

  it('allows removing either of two OAuth identities', () => {
    expect(removableProviders([google, discord], false)).toEqual(new Set(['google', 'discord']))
  })

  it('allows removing OAuth when a real password remains', () => {
    expect(removableProviders([email, google], true)).toEqual(new Set(['google']))
  })

  // The lockout case. The email identity exists but has no password behind
  // it, so removing Google would leave nothing to sign in with.
  it('blocks removing the last OAuth identity when email has no password', () => {
    expect(removableProviders([email, google], false)).toEqual(new Set())
  })

  it('allows removing email when an OAuth identity remains', () => {
    expect(removableProviders([email, google], false).has('email')).toBe(false)
    expect(removableProviders([email, google, discord], false)).toEqual(
      new Set(['email', 'google', 'discord'])
    )
  })

  it('handles an empty identity list', () => {
    expect(removableProviders([], false)).toEqual(new Set())
  })
})
```

Note the fifth test's first assertion: with `[email, google]` and no password, _nothing_ is removable — removing `email` is safe in isolation but the set is empty because Google is the only usable method and email-without-password is not usable. With Discord also present there are two usable OAuth methods, so all three become removable.

- [ ] **Step 2: Run the test and confirm it fails**

Run: `yarn test lib/__tests__/identity-guard.test.ts`
Expected: FAIL — cannot resolve `../identity-guard`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/identity-guard.ts

export type IdentitySummary = { provider: string }

// An 'email' identity is only a usable sign-in method when a password is
// actually set. Supabase can attach an email identity to an account that has
// never had one (automatic linking on an OAuth sign-in), so presence alone
// proves nothing.
function isUsable(identity: IdentitySummary, hasPassword: boolean): boolean {
  return identity.provider === 'email' ? hasPassword : true
}

// Returns the providers that can be disconnected without locking the user
// out — i.e. those whose removal leaves at least one usable method behind.
//
// Supabase's API only requires that 2+ identities remain, which is weaker:
// it would allow removing the sole OAuth identity from an account whose only
// other identity is a passwordless email one.
export function removableProviders(
  identities: IdentitySummary[],
  hasPassword: boolean
): Set<string> {
  const usableCount = identities.filter((i) => isUsable(i, hasPassword)).length

  return new Set(
    identities
      .filter((identity) => {
        const remaining = usableCount - (isUsable(identity, hasPassword) ? 1 : 0)
        return remaining >= 1
      })
      .map((i) => i.provider)
  )
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `yarn test lib/__tests__/identity-guard.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/identity-guard.ts lib/__tests__/identity-guard.test.ts
git commit -m "feat(auth): add unlink lockout guard"
```

---

### Task 3: PKCE callback route

**Files:**

- Create: `app/(auth)/auth/callback/route.ts`

**Interfaces:**

- Consumes: `safeNext` from `@/lib/auth-redirect` (Task 1); `createClient` from `@/lib/supabase/server`.
- Produces: `GET /auth/callback?code=...&next=...` — the redirect target for both `signInWithOAuth` and `linkIdentity`.

This is the piece the app is missing entirely. `app/(auth)/auth/confirm/route.ts` handles email OTP via `verifyOtp`; nothing handles a PKCE code exchange, so no OAuth flow can complete today.

One route serves both flows because `exchangeCodeForSession` behaves identically for a sign-in and a link — only the `next` destination differs.

- [ ] **Step 1: Write the route**

```ts
// app/(auth)/auth/callback/route.ts
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

import { safeNext } from '@/lib/auth-redirect'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  // A provider can also redirect back with an error instead of a code (the
  // user hit "Cancel" on the consent screen, most commonly).
  const providerError = searchParams.get('error_description') ?? searchParams.get('error')
  if (providerError) {
    redirect(`/auth/error?error=${encodeURIComponent(providerError)}`)
  }

  if (!code) {
    redirect(`/auth/error?error=${encodeURIComponent('No code provided')}`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    redirect(`/auth/error?error=${encodeURIComponent(error.message)}`)
  }

  // `origin` comes from the request, not NEXT_PUBLIC_SITE_URL, so a Vercel
  // preview deployment redirects to itself rather than to production.
  redirect(`${origin}${next}`)
}
```

Note: `redirect()` throws internally, so the calls above need no `return` and control never falls through. Do not wrap any of this in a try/catch — that would swallow the redirect signal, the same failure mode CLAUDE.md documents for `await connection()` in API routes.

- [ ] **Step 2: Type-check**

Run: `yarn tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Verify the proxy does not block the route**

Read `lib/supabase/proxy.ts` and confirm `/auth/callback` is not matched by `PROTECTED_PREFIXES` (`['/admin', '/profile', '/settings', '/looks']`). It is not — so an anonymous callback takes the no-session-cookie shortcut, and a link-flow callback (which does carry a cookie) proceeds through `getUser()` as a normal signed-in request.

This step is a read-and-confirm, not a change. It is called out because the callback is the one route where session cookies are mid-rewrite, and that file's comments document several logout bugs that came from assuming rather than checking. If `PROTECTED_PREFIXES` has gained an entry that matches, stop and report it rather than editing the proxy.

- [ ] **Step 4: Commit**

```bash
git add 'app/(auth)/auth/callback/route.ts'
git commit -m "feat(auth): add PKCE callback route for OAuth and linking"
```

---

### Task 4: Migration and Supabase config

**Files:**

- Create: `supabase/migrations/20260830120000_oauth_profile_metadata.sql`
- Modify: `supabase/config.toml` (line 175 `enable_manual_linking`; line ~221 `enable_confirmations`; new external provider blocks after `[auth.external.apple]` which ends at line 331)

**Interfaces:**

- Consumes: existing `public.generate_unique_username()` from `20260802001000_generate_random_usernames.sql`.
- Produces: no code interface. Populates `profiles.display_name` and `profiles.avatar_url` on OAuth signup.

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260830120000_oauth_profile_metadata.sql
--
-- Populate display_name and avatar_url from OAuth provider metadata on signup.
--
-- Google supplies full_name/picture; Discord supplies name/avatar_url. The
-- coalesce pairs cover both. An email signup carries neither key, so both
-- columns stay NULL — byte-identical to the previous behavior.
--
-- This fires AFTER INSERT ON auth.users only. Linking a provider to an
-- existing account inserts into auth.identities, not auth.users, so a later
-- link never overwrites a display name or avatar the user chose themselves.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
BEGIN
  INSERT INTO public.profiles (id, role, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    'user',
    public.generate_unique_username(),
    -- NULLIF guards a provider sending an empty string rather than omitting
    -- the key, which would otherwise store '' and render as a blank name.
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'full_name',
                    NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'avatar_url',
                    NEW.raw_user_meta_data->>'picture'), '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;
```

No `CREATE TRIGGER` — `on_auth_user_created` already exists and points at this function name; replacing the function is enough.

- [ ] **Step 2: Edit `supabase/config.toml`**

Three edits:

1. Line 175: `enable_manual_linking = false` → `enable_manual_linking = true`
2. Under `[auth.email]` (~line 221): `enable_confirmations = false` → `enable_confirmations = true`
3. After the `[auth.external.apple]` block (ends line 331, before the `# Allow Solana wallet holders` comment), add:

```toml
[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
# DO NOT commit your OAuth provider secret to git. Use environment variable substitution instead:
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
redirect_uri = ""
url = ""
# If enabled, the nonce check will be skipped. Required for local sign in with Google auth.
skip_nonce_check = true

[auth.external.discord]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_DISCORD_CLIENT_ID)"
# DO NOT commit your OAuth provider secret to git. Use environment variable substitution instead:
secret = "env(SUPABASE_AUTH_EXTERNAL_DISCORD_SECRET)"
redirect_uri = ""
url = ""
```

`skip_nonce_check = true` on Google only — the config's own comment says it is required for local sign-in with Google. Discord does not need it.

- [ ] **Step 3: Verify the config parses**

Run: `supabase start` (or `supabase stop && supabase start` if already running)
Expected: starts without a config parse error. A malformed key fails loudly here rather than in production.

If Docker is unavailable in this environment, skip the local start and instead confirm by eye that the keys match the reference at `supabase/config.toml` — `enable_manual_linking` at line 175 is confirmed present in CLI 2.116.0.

- [ ] **Step 4: Apply the migration locally and verify the trigger**

Run: `supabase db reset`

Then verify both paths with SQL against the local DB:

```sql
-- email signup path: both columns stay NULL
insert into auth.users (id, email, raw_user_meta_data)
values (gen_random_uuid(), 'plain@example.com', '{}'::jsonb);

-- google path: full_name + picture land in the profile
insert into auth.users (id, email, raw_user_meta_data)
values (gen_random_uuid(), 'g@example.com',
        '{"full_name":"Ada L","picture":"https://cdn/x.png"}'::jsonb);

-- discord path: name + avatar_url land in the profile
insert into auth.users (id, email, raw_user_meta_data)
values (gen_random_uuid(), 'd@example.com',
        '{"name":"ada","avatar_url":"https://cdn/y.png"}'::jsonb);

select u.email, p.display_name, p.avatar_url, p.username
from public.profiles p join auth.users u on u.id = p.id;
```

Expected: `plain@` has NULL display_name and avatar_url; `g@` has `Ada L` / `https://cdn/x.png`; `d@` has `ada` / `https://cdn/y.png`; all three have a non-null random username.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260830120000_oauth_profile_metadata.sql supabase/config.toml
git commit -m "feat(auth): populate profile from OAuth metadata; enable providers"
```

---

### Task 5: OAuth buttons on login and sign-up

**Files:**

- Create: `components/discord-icon.tsx`, `components/oauth-buttons.tsx`
- Modify: `app/(auth)/login/login-form.tsx`, `app/(auth)/sign-up/sign-up-form.tsx`, `app/(auth)/sign-up-success/page.tsx`

**Interfaces:**

- Consumes: `createClient` from `@/lib/supabase/client`; the callback route from Task 3.
- Produces: `<OAuthButtons />` — default export, no required props. Optional `next?: string` (default `'/'`) for the post-login destination.

Lives in `components/` rather than beside either page because two unrelated routes import it — that is the promotion rule in CLAUDE.md.

- [ ] **Step 1: Create the Discord icon**

MUI Icons ships a `Google` mark but has no Discord one, and Lucide removed brand icons. Inline the SVG rather than adding a dependency for one glyph.

```tsx
// components/discord-icon.tsx
import SvgIcon, { type SvgIconProps } from '@mui/material/SvgIcon'

export default function DiscordIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M20.317 4.369a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.096 2.157 2.42 0 1.333-.955 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </SvgIcon>
  )
}
```

- [ ] **Step 2: Create the buttons component**

```tsx
// components/oauth-buttons.tsx
'use client'

import { useState } from 'react'
import GoogleIcon from '@mui/icons-material/Google'
import { Button, Divider, Stack, Typography } from '@mui/material'

import DiscordIcon from '@/components/discord-icon'
import { createClient } from '@/lib/supabase/client'

type Provider = 'google' | 'discord'

export default function OAuthButtons({ next = '/' }: { next?: string }) {
  const [pending, setPending] = useState<Provider | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSignIn(provider: Provider) {
    setPending(provider)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })

    // On success the browser navigates away, so this only runs on failure.
    if (error) {
      setError(error.message)
      setPending(null)
    }
  }

  return (
    <Stack spacing={1.5}>
      <Button
        fullWidth
        disabled={pending !== null}
        size="large"
        startIcon={<GoogleIcon />}
        variant="outlined"
        onClick={() => handleSignIn('google')}
      >
        {pending === 'google' ? 'Redirecting…' : 'Continue with Google'}
      </Button>
      <Button
        fullWidth
        disabled={pending !== null}
        size="large"
        startIcon={<DiscordIcon />}
        variant="outlined"
        onClick={() => handleSignIn('discord')}
      >
        {pending === 'discord' ? 'Redirecting…' : 'Continue with Discord'}
      </Button>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Divider>
        <Typography color="textSecondary" variant="body">
          or
        </Typography>
      </Divider>
    </Stack>
  )
}
```

Errors render with the same inline `<p className="text-sm text-red-500">` that `login-form.tsx` and `sign-up-form.tsx` already use.

`SnackbarAlertProvider` _is_ available here — it sits inside `ThemedApp` in the root layout (`app/layout.tsx:130`), so it wraps the `(auth)` group too. Inline is still the right call: both auth forms display their own errors inline, and an auth error belongs next to the form that produced it rather than floating in a corner. Consistency with the immediate neighbours wins. Do not "fix" this to `enqueueSnackbar`.

- [ ] **Step 3: Mount in the login form**

In `app/(auth)/login/login-form.tsx`, add the import and render the buttons directly inside `<CardContent>`, above `<form onSubmit={handleLogin}>`:

```tsx
import OAuthButtons from '@/components/oauth-buttons'
```

```tsx
<CardContent>
  <OAuthButtons />
  <form onSubmit={handleLogin}>
```

- [ ] **Step 4: Mount in the sign-up form**

Identical change in `app/(auth)/sign-up/sign-up-form.tsx` — import, then `<OAuthButtons />` immediately inside `<CardContent>` above `<form onSubmit={handleSignUp}>`.

- [ ] **Step 5: Soften the sign-up success copy**

Supabase deliberately returns an obfuscated success — and sends no email — when someone signs up with an address already held by an OAuth account. This is anti-enumeration and cannot be detected server-side, so the page must not assert that an email was sent.

In `app/(auth)/sign-up-success/page.tsx`, replace the `CardHeader` subheader and the body `Typography`:

```tsx
<CardHeader subheader="Check your email" title="Thank you for signing up!" />
<CardContent>
  <Typography color="textSecondary" variant="body">
    If that address is new, we&apos;ve sent you a confirmation link. If you already have an
    account, try signing in instead — including with Google or Discord.
  </Typography>
</CardContent>
```

- [ ] **Step 6: Type-check and run the full suite**

Run: `yarn tsc --noEmit && yarn test`
Expected: no type errors; all tests pass.

- [ ] **Step 7: Commit**

```bash
git add components/oauth-buttons.tsx components/discord-icon.tsx \
  'app/(auth)/login/login-form.tsx' 'app/(auth)/sign-up/sign-up-form.tsx' \
  'app/(auth)/sign-up-success/page.tsx'
git commit -m "feat(auth): add Google and Discord buttons to login and sign-up"
```

Note the quoting — `git add` on a path containing `(auth)` or `[slug]` needs quotes in zsh or glob expansion eats it.

---

### Task 6: Connected accounts in settings

**Files:**

- Create: `app/settings/connected-accounts.tsx`
- Modify: `app/settings/actions.ts`, `app/settings/account-settings.tsx`

**Interfaces:**

- Consumes: `removableProviders`, `IdentitySummary` from `@/lib/identity-guard` (Task 2); the callback route (Task 3); `createAdminClient` from `@/lib/supabase/admin`; `createClient` from `@/lib/supabase/server` and `@/lib/supabase/client`.
- Produces:
  - `getHasPassword(): Promise<boolean>` — Server Action in `app/settings/actions.ts`.
  - `<ConnectedAccounts />` — default export, no props.

- [ ] **Step 1: Add the `getHasPassword` Server Action**

Append to `app/settings/actions.ts`:

```ts
// Whether the signed-in user has a password set.
//
// The JS client's User type has no has_password field, and inferring it from
// the presence of an 'email' identity is wrong — automatic linking can attach
// an email identity to an account that never had a password. Reading
// auth.users directly is the only exact answer, and being exact is the whole
// point of the unlink guard that consumes this.
export async function getHasPassword(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // The user id comes from the verified session, never from a caller-supplied
  // argument: the admin client bypasses RLS, so an id parameter here would let
  // any caller probe any account.
  if (!user) return false

  const admin = createAdminClient()
  const { data, error } = await admin
    .schema('auth')
    .from('users')
    .select('encrypted_password')
    .eq('id', user.id)
    .single()

  if (error) throw new Error(error.message)

  return Boolean(data?.encrypted_password)
}
```

If `.schema('auth')` is rejected by the generated `Database` type (it types the `public` schema only), fall back to an RPC. Add to the same migration file from Task 4:

```sql
create or replace function public.current_user_has_password()
returns boolean
language sql
security definer
set search_path to ''
stable
as $function$
  select coalesce(
    (select encrypted_password is not null and encrypted_password <> ''
     from auth.users where id = auth.uid()),
    false);
$function$;

revoke all on function public.current_user_has_password() from public;
grant execute on function public.current_user_has_password() to authenticated;
```

and call `supabase.rpc('current_user_has_password')` from the Server Action instead. The RPC reads `auth.uid()` from the caller's JWT, so it needs no admin client and no id parameter at all — prefer this if the typed path is awkward. Report which route you took.

- [ ] **Step 2: Build the Connected accounts component**

```tsx
// app/settings/connected-accounts.tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import GoogleIcon from '@mui/icons-material/Google'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import { Alert, Button, Divider, Stack, Typography } from '@mui/material'

import DiscordIcon from '@/components/discord-icon'
import { removableProviders, type IdentitySummary } from '@/lib/identity-guard'
import { createClient } from '@/lib/supabase/client'
import { getHasPassword } from '@/app/settings/actions'

const PROVIDERS = [
  { id: 'email', label: 'Email and password', icon: MailOutlineIcon },
  { id: 'google', label: 'Google', icon: GoogleIcon },
  { id: 'discord', label: 'Discord', icon: DiscordIcon },
] as const

type Identity = IdentitySummary & { id: string; identity_id?: string; email?: string }

export default function ConnectedAccounts() {
  const [identities, setIdentities] = useState<Identity[] | null>(null)
  const [hasPassword, setHasPassword] = useState(false)
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const [{ data, error }, passwordSet] = await Promise.all([
      supabase.auth.getUserIdentities(),
      getHasPassword(),
    ])
    if (error) setError(error.message)
    setIdentities((data?.identities ?? []) as Identity[])
    setHasPassword(passwordSet)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleConnect(provider: 'google' | 'discord') {
    setPending(provider)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/settings')}`,
      },
    })
    if (error) {
      setError(error.message)
      setPending(null)
    }
  }

  async function handleDisconnect(identity: Identity) {
    setPending(identity.provider)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.unlinkIdentity(identity)
    if (error) setError(error.message)
    else await load()
    setPending(null)
  }

  const removable = identities ? removableProviders(identities, hasPassword) : new Set<string>()

  return (
    <Stack spacing={2}>
      <Divider />
      <Typography component="h2" size="large" variant="title">
        Connected accounts
      </Typography>
      <Typography color="textSecondary" variant="body">
        Sign in to your account with any of these. You can connect more than one.
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {identities === null ? (
        <Typography color="textSecondary" variant="body">
          Loading…
        </Typography>
      ) : (
        PROVIDERS.map(({ id, label, icon: Icon }) => {
          const identity = identities.find((i) => i.provider === id)
          const canRemove = removable.has(id)

          return (
            <Stack
              key={id}
              spacing={2}
              sx={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Stack spacing={1.5} sx={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon />
                <Stack>
                  <Typography variant="body">{label}</Typography>
                  <Typography color="textSecondary" size="small" variant="body">
                    {identity ? (identity.email ?? 'Connected') : 'Not connected'}
                  </Typography>
                </Stack>
              </Stack>

              {identity ? (
                <Stack sx={{ alignItems: 'flex-end' }}>
                  <Button
                    disabled={!canRemove || pending !== null}
                    size="small"
                    variant="outlined"
                    onClick={() => handleDisconnect(identity)}
                  >
                    {pending === id ? 'Working…' : 'Disconnect'}
                  </Button>
                  {!canRemove && (
                    <Typography color="textSecondary" size="small" variant="body">
                      This is your only sign-in method
                    </Typography>
                  )}
                </Stack>
              ) : (
                id !== 'email' && (
                  <Button
                    disabled={pending !== null}
                    size="small"
                    variant="outlined"
                    onClick={() => handleConnect(id)}
                  >
                    {pending === id ? 'Redirecting…' : 'Connect'}
                  </Button>
                )
              )}
            </Stack>
          )
        })
      )}
    </Stack>
  )
}
```

Note every `Stack` puts `flexDirection`/`alignItems`/`justifyContent` in `sx`, never as direct props — a direct prop is a TypeScript build error in this codebase.

The Email row shows no Connect button when absent: adding a password is what the Change password section does, so a second control would be a duplicate path to the same thing.

- [ ] **Step 3: Mount it and make the password copy conditional**

In `app/settings/account-settings.tsx`:

1. Import at the top:

```tsx
import ConnectedAccounts from '@/app/settings/connected-accounts'
import { getHasPassword } from '@/app/settings/actions'
```

2. In `ChangePasswordSection`, load the flag and switch the copy:

```tsx
const [hasPassword, setHasPassword] = useState(true)

useEffect(() => {
  void getHasPassword().then(setHasPassword)
}, [])
```

Then use `hasPassword ? 'Change password' : 'Set password'` for the `Typography` heading, and `hasPassword ? 'Update password' : 'Set password'` for the button label. Add `useEffect` to the existing `react` import.

3. In the `AccountSettings` default export, insert `<ConnectedAccounts />` between `<ChangePasswordSection />` and the `{!isAdmin && <AdminAccessSection />}` line.

- [ ] **Step 4: Type-check and run the suite**

Run: `yarn tsc --noEmit && yarn test`
Expected: no type errors; all tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/settings/connected-accounts.tsx app/settings/actions.ts app/settings/account-settings.tsx
git commit -m "feat(settings): add connected accounts with link and unlink"
```

---

### Task 7: Documentation

**Files:**

- Modify: `CLAUDE.md`

- [ ] **Step 1: Add the new environment variables**

In the Environment Variables block, after `STRIPE_WEBHOOK_SECRET=`:

```env
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=      # OAuth; local dev via supabase/config.toml
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=
SUPABASE_AUTH_EXTERNAL_DISCORD_CLIENT_ID=
SUPABASE_AUTH_EXTERNAL_DISCORD_SECRET=
```

These are consumed by the local Supabase stack through `config.toml`, not by Next.js. In production the values live in the Supabase dashboard instead. Say so in a following line so nobody hunts for them in Vercel.

- [ ] **Step 2: Add `yarn test` to the Commands block**

The Commands block lists `dev/build/start/lint/format/lint:fix` and states "Only `dev/build/start/lint/format/lint:fix` are package scripts" — but `test` and `test:watch` exist in `package.json` and that line is now wrong. Add:

```bash
yarn test         # Run Vitest once
yarn test:watch   # Vitest in watch mode
```

and correct the trailing sentence to include them.

- [ ] **Step 3: Document the auth routes**

Add a short subsection under Architecture, after **Middleware**:

```markdown
### Auth Routes

`app/(auth)/auth/confirm/route.ts` verifies email OTP tokens (`verifyOtp`).
`app/(auth)/auth/callback/route.ts` exchanges a PKCE code for a session and serves BOTH
`signInWithOAuth` and `linkIdentity` — they differ only in the `next` destination. Both routes
validate `next` through `safeNext()` (`lib/auth-redirect.ts`); a bare `startsWith('/')` check is
not enough, since `//evil.com` is protocol-relative.

One account can hold several identities (email, google, discord). Supabase auto-links a new OAuth
identity to an existing user when the emails match AND the existing email is confirmed; when it is
not confirmed, the unconfirmed identity is REMOVED instead. `lib/identity-guard.ts` holds the
unlink rule — an `email` identity only counts as a usable sign-in method when a password is
actually set.
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document auth routes, OAuth env vars, and test commands"
```

---

## Manual verification checklist

These need real providers and a real browser, so they cannot be automated. Run them after the maintainer completes the console setup (Google Cloud client, Discord application, Supabase dashboard providers + Confirm email + Manual linking + redirect allow-list).

**Confirm email must be enabled before the providers go live**, or new signups keep landing unconfirmed and inherit the same hazard as the 14 legacy accounts.

- [ ] Google sign-up with a brand-new email → account created; profile shows the Google name and avatar.
- [ ] Discord sign-up with a brand-new email → same.
- [ ] Existing **confirmed** password user signs in with Google on the same email → lands in the existing account; collection data intact; both methods listed in settings.
- [ ] Existing **unconfirmed** password user signs in with Google → keeps account and collection data; password identity gone; can set a new password from settings.
- [ ] Password user links Discord from settings using a **different** email → succeeds. (This is the check that manual linking actually took effect.)
- [ ] OAuth-only user sets a password from settings, signs out, signs back in with it.
- [ ] Disconnect is disabled on a single-identity account, and on the last-OAuth-without-password case.
- [ ] Disconnect works with two identities present, and the row updates without a page reload.
- [ ] Full flow on a Vercel preview deployment → redirects to the preview origin, not production.
- [ ] Cancel the Google consent screen → lands on `/auth/error` with a readable message, not a crash.
