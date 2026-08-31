# OAuth Login & Account Linking Design

**Date:** 2026-08-30
**Status:** Approved

## Problem

The app offers exactly one way to sign in: email and password, via
`app/(auth)/login/login-form.tsx` calling `signInWithPassword`. All 96 existing users hold a single
`email` identity — there is not one OAuth identity in the project.

That costs signups at the door, and it leaves the account model rigid: whichever credential someone
picked at signup is the only one they will ever have. Someone who signs up with a password and later
wants to click "Continue with Google" has no path to it, and someone who arrives through Google has
no way to add a password as a fallback.

There is also a structural gap. The app has `app/(auth)/auth/confirm/route.ts`, which verifies email
OTP tokens via `verifyOtp`. It has no PKCE code-exchange route, so no OAuth flow can complete today
even if a provider were enabled in the dashboard.

## Goals

- Let users sign in and sign up with Google or Discord alongside email/password.
- Let one account hold multiple sign-in methods, linkable in both directions:
  - an existing password user can attach Google and/or Discord;
  - an OAuth-only user can set a password.
- Give users a place to see which methods are connected and to disconnect ones they don't want.
- Never let a disconnect leave an account with no way to sign in.
- Give OAuth signups a populated profile (display name, avatar) instead of a blank one.

## Non-Goals

- **Merging two separate existing accounts.** If someone already has an account under
  `a@example.com` and another under `b@example.com`, this design does not combine them. Supabase
  cannot merge users, so it would mean hand-migrating every collection row across `obtained_eureka`,
  `obtained_outfit`, `obtained_makeup`, `obtained_momo_cloaks`, and `looks`. If this is wanted, it is
  its own project.
- Other providers (GitHub, Apple, Twitch). The design generalizes, but only two ship.
- Native mobile OAuth via `linkIdentityWithIdToken`. Web redirect flow only.
- Backfilling provider data onto existing profiles.

## Background: how Supabase linking actually works

Worth stating plainly, because the behavior is largely automatic and the design mostly consists of
choosing which of its modes to enable.

`auth.identities` is already the linking table. A user row can own many identity rows. No new schema
is needed to model "one account, several login methods" — that is the built-in shape.

**Automatic linking.** When a new OAuth sign-in arrives, Supabase looks for an existing user with the
same email. If it finds one, the new identity is attached to that user. This is what makes "Continue
with Google" return a password user to their existing collection rather than stranding them in a new
empty account.

**The unconfirmed-email hazard.** Automatic linking is only safe against a _confirmed_ address —
otherwise anyone could claim an account by signing up with someone else's email and then OAuth-ing
in. Supabase's defense is blunt: when linking to a user with unconfirmed identities, it **removes
those unconfirmed identities**. So for a user whose email was never confirmed, an OAuth sign-in
attaches the OAuth identity and destroys the password identity.

This project has **14 of 96 users with `email_confirmed_at IS NULL`**, because
`supabase/config.toml` currently sets `enable_confirmations = false`. Those 14 are exactly the
accounts where an OAuth sign-in silently removes password login.

**Manual linking** — linking a provider whose email _differs_ from the account email — is a separate
opt-in (`GOTRUE_SECURITY_MANUAL_LINKING_ENABLED`, exposed as a dashboard toggle), off by default.

**Adding a password** to an OAuth account is just `updateUser({ password })`. No special API.

## Decisions

| Question                    | Decision                                                      | Why                                                                                                                                                                                                                                                                         |
| --------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The 14 unconfirmed accounts | Enable confirmations going forward; leave the 14 as they are  | New signups become safe to auto-link. The 14 keep working; if one signs in via OAuth they keep the account and all collection data (same user id) but lose the password, which they can re-add from settings. No data loss, no confirming addresses nobody proved they own. |
| Manual linking              | Enable it                                                     | Most people's Discord email differs from their signup email. Without it the settings "Connect" button only works by coincidence.                                                                                                                                            |
| Link/unlink UI location     | New section in the Account settings tab                       | Where Change email and Change password already live.                                                                                                                                                                                                                        |
| OAuth button placement      | Login **and** sign-up pages                                   | OAuth is both paths at once; a user who clicks it on either page must land in the right place.                                                                                                                                                                              |
| Unlink guard                | Block when it would leave no sign-in method                   | The failure mode is locking someone out of their own account. Worth explicit code rather than relying on Supabase's weaker "≥2 identities" rule.                                                                                                                            |
| OAuth profile data          | Populate `display_name` + `avatar_url` from provider metadata | A populated profile beats a blank one; costs one migration.                                                                                                                                                                                                                 |

## Architecture

Three flows converge on one new route.

### Flow A — OAuth sign-in / sign-up

From `login-form.tsx` or `sign-up-form.tsx`, browser client:

```ts
await supabase.auth.signInWithOAuth({
  provider, // 'google' | 'discord'
  options: { redirectTo: `${window.location.origin}/auth/callback?next=/` },
})
```

The provider redirects to Supabase, which redirects to the new callback route with a PKCE code.

Three outcomes, all resolved by Supabase without app logic:

1. **No user with that email** → new user created; `handle_new_user()` creates the profile.
2. **Existing user, email confirmed** → identity auto-linked; user lands in their existing account
   with all collection data intact.
3. **Existing user, email unconfirmed** → identity auto-linked, password identity removed. The
   accepted cost on the 14 legacy accounts.

### Flow B — linking from settings

Signed in, from the Connected accounts section:

```ts
await supabase.auth.linkIdentity({
  provider,
  options: { redirectTo: `${window.location.origin}/auth/callback?next=/settings` },
})
```

Same callback route. `exchangeCodeForSession` treats both flows identically, so one route serves
both — the only difference is the `next` destination.

### Flow C — adding a password to an OAuth-only account

Already implemented. `ChangePasswordSection` in `app/settings/account-settings.tsx` calls
`updateUser({ password })`, which works whether or not a password exists. Only the copy changes:
"Set password" when the account has none.

### The callback route

New file `app/(auth)/auth/callback/route.ts`:

```ts
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) redirect(`${origin}${next}`)
    redirect(`/auth/error?error=${encodeURIComponent(error.message)}`)
  }

  redirect(`/auth/error?error=${encodeURIComponent('No code provided')}`)
}
```

Two details carried over deliberately from `/auth/confirm`:

- **`next` is validated**, not interpolated raw. `safeNext` accepts only a value that
  `startsWith('/')` and does not `startsWith('//')`, defaulting to `/`. Without this the parameter is
  an open redirect: `?next=//evil.com` produces a protocol-relative URL the browser follows offsite.
  `/auth/confirm` already guards this way; the two should not disagree.
- **`origin` comes from the request**, not `NEXT_PUBLIC_SITE_URL`, so Vercel preview deployments
  redirect to themselves rather than to production.

`safeNext` is exported so it can be unit-tested without invoking the route.

### Proxy interaction

`/auth/callback` falls under the `proxy.ts` matcher but is not in `PROTECTED_PREFIXES`, so it is not
gated. For Flow A the request carries no `sb-*-auth-token` cookie and takes the anonymous shortcut.
For Flow B it does carry one, so `getUser()` runs and the request proceeds as a normal signed-in
request.

No proxy change is expected. **Verify during implementation** rather than assuming: the callback is
the one route where cookies are mid-rewrite, and `lib/supabase/proxy.ts` carries extensive comments
about exactly this class of session bug.

## Database

One migration, extending `handle_new_user()` (current version lives in
`supabase/migrations/20260802001000_generate_random_usernames.sql`):

```sql
INSERT INTO public.profiles (id, role, username, display_name, avatar_url)
VALUES (
  NEW.id,
  'user',
  public.generate_unique_username(),
  NULLIF(COALESCE(NEW.raw_user_meta_data->>'full_name',
                  NEW.raw_user_meta_data->>'name'), ''),
  NULLIF(COALESCE(NEW.raw_user_meta_data->>'avatar_url',
                  NEW.raw_user_meta_data->>'picture'), '')
)
ON CONFLICT (id) DO NOTHING;
```

Google supplies `full_name` and `picture`; Discord supplies `name` and `avatar_url`. The coalesce
pairs cover both. Email signups carry neither key, so they get `NULL` for both — byte-identical to
today's behavior. `NULLIF` guards a provider sending an empty string.

Two deliberate omissions:

- **No backfill.** Existing rows are untouched.
- **No effect on linking.** The trigger is `AFTER INSERT ON auth.users`; linking a provider to an
  existing account inserts into `auth.identities`, not `auth.users`, so it does not fire. A user's
  chosen display name and uploaded avatar are never overwritten by a later link.

`username` stays randomly generated. Provider display names are not unique and are not valid handles.

`profiles.avatar_url` holds a full URL and is passed straight to `LazyImage`, so a provider CDN URL
needs no transformation. `lib/image-transform.ts` rewrites only Supabase storage URLs, so a Google or
Discord avatar passes through its thumbnail logic untouched — correct, and no change needed.

## UI

### `components/oauth-buttons.tsx` (new, shared)

Imported by both `login-form.tsx` and `sign-up-form.tsx`. Two unrelated routes consume it, so per the
colocation rule in CLAUDE.md it belongs in `components/`, not beside either page.

Two full-width outlined MUI Buttons — "Continue with Google", "Continue with Discord" — rendered
above the email form with a `Divider` reading "or" between. Each owns its loading state; errors
surface through the same inline pattern the forms already use (`{error && <p className="text-sm
text-red-500">`), not `notistack` — the `(auth)` layout has no `SnackbarAlertProvider` above it.
**Verify that during implementation**; if a provider is in scope, use it for consistency instead.

Icons: MUI Icons ships a `Google` mark but has no Discord one, and Lucide dropped brand icons. Inline
a small Discord SVG as a local component rather than taking a dependency for one glyph.

### `ConnectedAccountsSection` in `app/settings/account-settings.tsx`

Placed between Change password and the admin/danger sections. One row per provider — Email, Google,
Discord — each showing connected state and the identity's email where present:

- Connected, safe to remove → outlined "Disconnect".
- Connected, unsafe to remove → disabled button plus helper text saying why.
- Not connected → "Connect", calling `linkIdentity`.

Identities are read client-side via `getUserIdentities()` on mount and re-read after a link or
unlink. The settings page does already fetch `user` server-side and thread it through `SettingsTabs`,
but `user.identities` there is a page-load snapshot that goes stale the moment someone links; a
client fetch that can re-run is simpler than re-threading props through three components.

### The unlink guard

Disconnect is disabled when either:

1. it is the only remaining identity, or
2. it is the last OAuth identity and the account has no password set.

Condition 2 needs a fact Supabase does not expose: **the JS client's `User` type has no
`has_password` field.** Inferring it from "an `email` identity exists" is wrong — an auto-linked
OAuth user can hold an email identity with no password behind it, and trusting that inference is
exactly how someone gets locked out.

So: a small Server Action in `app/settings/actions.ts` using the existing `createAdminClient()` to
read whether `auth.users.encrypted_password IS NOT NULL` for the calling user, returning a plain
`{ hasPassword: boolean }`. It must resolve the user from the session via `getUser()` and never from
a client-supplied id — the admin client bypasses RLS, so an id parameter here would let any caller
probe any account.

The predicate itself is extracted as a pure function — identities plus `hasPassword` in, the set of
removable providers out — so the lockout logic is unit-testable away from the component.

The same `hasPassword` flag drives the Change password section's copy ("Set password" when false).

## Configuration

**Console work (manual, done by the maintainer — secrets never enter the repo):**

1. **Google Cloud Console** — OAuth 2.0 client; authorized redirect URI
   `https://ykfuevyqpjvtxidjnhxm.supabase.co/auth/v1/callback`.
2. **Discord Developer Portal** — application → OAuth2; same redirect URI; scopes `identify email`.
3. **Supabase dashboard → Authentication → Providers** — enable Google and Discord, paste both
   client ID / secret pairs.
4. **Supabase dashboard → Authentication** — enable **Confirm email**, enable **Manual linking**.
5. **Supabase dashboard → URL Configuration** — add `http://localhost:3000/**` and the Vercel
   preview wildcard to the redirect allow-list, so local dev and preview deploys can complete the
   flow.

**In-repo:** mirror the dashboard settings in `supabase/config.toml` so local dev matches production:

- `enable_confirmations = true` under `[auth.email]` (currently `false`).
- `[auth.external.google]` and `[auth.external.discord]` blocks, `enabled = true`, with
  `client_id` / `secret` reading `env(...)`.
- Manual linking. Confirm the current key name against the installed CLI's config reference before
  writing it — it is not exposed under `[auth.external.*]`, and the self-hosted environment variable
  is `GOTRUE_SECURITY_MANUAL_LINKING_ENABLED`. If the installed CLI version has no equivalent key,
  note it in the file as dashboard-only rather than inventing one, since a bad key fails
  `supabase start`.

Add the new variable names to the environment block in `CLAUDE.md`. Actual secrets go in
`.env.local`, which a PreToolUse hook blocks Claude from editing, so the maintainer adds those by
hand.

Note the ordering constraint: **step 4's Confirm email must be on before OAuth providers go live**,
or new signups keep landing unconfirmed and inherit the same hazard as the legacy 14.

## Error handling

- Failed code exchange → redirect to the existing `/auth/error?error=<message>`, matching what
  `/auth/confirm` does.
- Failed link (e.g. that provider account is already attached to a different user) → inline `Alert`
  in the settings section with the Supabase message.
- Failed unlink → inline `Alert`. Should be unreachable given the guard, but the API is the real
  authority.
- **Anti-enumeration case, unfixable by design:** signing up with email at an address already held by
  an OAuth account returns an obfuscated success and sends no email. Supabase does this deliberately
  to prevent user enumeration, and it cannot be detected server-side. Soften the copy on
  `app/(auth)/sign-up-success/page.tsx` to "If that address is new, check your email for a
  confirmation link" rather than asserting an email was sent.

## Testing

**Unit (Vitest, existing setup)** — the logic where a bug has real consequences:

- `safeNext` — a valid path, `//evil.com`, `https://evil.com`, absent, empty string. Open-redirect
  protection deserves a test.
- The unlink-guard predicate — single email identity with password; single OAuth identity without
  password; OAuth + email-without-password; OAuth + email-with-password; two OAuth identities. The
  case that must never say "removable" is any that leaves zero usable methods.
- Trigger SQL behavior for Google keys, Discord keys, and neither, if a DB test harness is available;
  otherwise it is covered by the manual checklist.

**Manual checklist** — the OAuth round-trips need real providers and a real browser, so this stays a
checklist rather than pretending to be automated:

1. Google sign-up, brand-new email → account created, profile shows Google name and avatar.
2. Discord sign-up, brand-new email → same.
3. Existing **confirmed** password user signs in with Google on the same email → lands in the
   existing account, collection data intact, both methods listed in settings.
4. Existing **unconfirmed** password user signs in with Google → keeps account and collection data;
   password identity gone; can set a new password from settings.
5. Password user links Discord from settings using a _different_ email → succeeds (this is the check
   that manual linking is actually enabled).
6. OAuth-only user sets a password, then signs in with it.
7. Disconnect is disabled on a single-identity account and on the last-OAuth-without-password case.
8. Disconnect works with two identities present.
9. Full flow on a Vercel preview deployment → redirects to the preview origin, not production.
