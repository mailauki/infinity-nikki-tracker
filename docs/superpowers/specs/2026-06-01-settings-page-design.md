# Settings Page Design

**Date:** 2026-06-01  
**Status:** Approved

## Overview

Add a `/settings` page as a tabbed hub with three tabs: **Profile** (edit form), **Appearance** (theme picker), and **Account** (email, password, delete account). The existing `/profile` page becomes read-only. The nav already has a `Settings` link pointing to `/settings` — no nav changes needed.

---

## Routes

| Route | Change |
|-------|--------|
| `app/settings/page.tsx` | **New** — tabbed settings hub |
| `app/profile/page.tsx` | **Modified** — stripped to read-only view |

### `/settings`

- Accessible to guests and logged-in users
- Server Component fetches auth via `getUserID()` and `supabase.auth.getUser()`
- Passes `isLoggedIn: boolean` and `user: User | null` to `<SettingsTabs>`
- No auth redirect — guests are handled within the tabs

### `/profile`

- Still requires auth — redirects to `/auth/login` if not signed in
- Renders read-only `ProfileView` (avatar, name, username, admin chip) + `CollectionStats` + `RecentUpdates`
- Removes `ProfileForm` entirely from this page
- Nav link in `navSecondary` stays pointing to `/profile`

---

## Settings Page Structure

### `app/settings/page.tsx`

Server Component. Fetches:
- `getUserID()` → `user_id`
- `supabase.auth.getUser()` → `user`

Renders `<SettingsTabs isLoggedIn={!!user_id} user={user} />`.

### `components/settings/settings-tabs.tsx`

`'use client'` component. Manages active tab with `useState<'profile' | 'appearance' | 'account'>`.

**Default tab:** `'appearance'` for guests, `'profile'` for logged-in users.

**Tab visibility:**
- `appearance` — always shown
- `profile` — hidden if `!isLoggedIn`
- `account` — hidden if `!isLoggedIn`

**Guest fallback:** If a guest somehow reaches a hidden tab (e.g., via direct URL state manipulation), show the existing `<LoginAlert />` component instead of tab content.

**Tab labels use MUI `Tabs` + `Tab`.** Active tab content rendered conditionally below.

---

## Tab Contents

### Profile Tab

Component: `components/settings/profile-settings.tsx`

Wraps `ProfileForm` with `alwaysEdit={true}` prop, which bypasses the `ProfileView` read-only branch and always renders the edit form.

`ProfileForm` change: add optional `alwaysEdit?: boolean` prop. When `true`, skip the `if (!profileEdit?.isEditing)` branch that renders `<ProfileView>`.

### Appearance Tab

Component: `components/settings/appearance-settings.tsx`

Renders theme options inline as a visible button group (not the icon-button dropdown from `ThemeSwitcher`). Uses `useColorScheme()` from MUI.

Three options: System, Light, Dark — rendered as MUI `ToggleButtonGroup` / `ToggleButton` with icons and labels.

`ThemeSwitcher` in the nav footer is **unchanged** — it stays as the compact icon button.

### Account Tab

Component: `components/settings/account-settings.tsx`

Three sections separated by `<Divider>`:

**1. Change email**
- `TextField` (type `email`) + submit `Button`
- Calls `supabase.auth.updateUser({ email })` from browser client (`lib/supabase/client.ts`)
- Success state: `Alert` — "Confirmation sent to your new email"
- Error state: inline `Alert` with error message

**2. Change password**
- Two `TextField`s: new password + confirm password
- Client-side validation: passwords must match before submit
- Calls `supabase.auth.updateUser({ password })`
- Same pattern as `app/auth/update-password/update-password-form.tsx` but inline (no `Card` wrapper)
- Success state: `Alert` — "Password updated"

**3. Danger zone**
- "Delete account" `Button` with `color="error"` variant `outlined`
- Opens MUI `Dialog` asking for confirmation: "This will permanently delete your account and all your data. This cannot be undone."
- On confirm: calls a Server Action in `app/settings/actions.ts` that:
  1. Uses the Supabase server client to delete the user via `supabase.auth.admin.deleteUser(user_id)`
  2. Signs the user out
  3. Redirects to `/`

---

## Files

### New Files

| File | Type | Purpose |
|------|------|---------|
| `app/settings/page.tsx` | Server Component | Auth fetch + render `SettingsTabs` |
| `app/settings/actions.ts` | Server Action | `deleteAccount()` action |
| `components/settings/settings-tabs.tsx` | Client Component | Tab container with `useState` |
| `components/settings/profile-settings.tsx` | Client Component | Wraps `ProfileForm` in always-edit mode |
| `components/settings/appearance-settings.tsx` | Client Component | Inline theme toggle |
| `components/settings/account-settings.tsx` | Client Component | Email, password, delete account |

### Modified Files

| File | Change |
|------|--------|
| `app/profile/page.tsx` | Remove `ProfileForm`; render `ProfileView` directly with fetched profile data |
| `components/forms/auth/profile-form.tsx` | Add `alwaysEdit?: boolean` prop |

### Unchanged Files

| File | Reason |
|------|--------|
| `components/navbar/theme-switcher.tsx` | Nav footer compact switcher stays as-is |
| `lib/nav-links.tsx` | `Settings` link already points to `/settings` |
| `app/auth/update-password/` | Existing reset-password flow via email link unchanged |

---

## Auth & Access

| State | Tabs shown | Default tab |
|-------|-----------|-------------|
| Guest | Appearance only | appearance |
| Logged in | Profile, Appearance, Account | profile |

No redirect at the page level for guests — handled within `SettingsTabs`.

---

## Key Constraints

- Delete account uses `supabase.auth.admin.deleteUser()` — requires service role key (`SUPABASE_SERVICE_ROLE_KEY`), only safe in a Server Action (never in a Client Component). Requires a new `lib/supabase/admin.ts` that creates a client with the service role key.
- `ProfileForm` relies on `useProfileEdit()` context from `app/profile/profile-context.tsx`. When `alwaysEdit={true}`, the context check is bypassed entirely — `profile-settings.tsx` does NOT need to wrap in `ProfileEditProvider`.
- `/profile` page needs profile data server-side after `ProfileForm` (which fetched its own data client-side) is removed. Add a query for `full_name, username, avatar_url` from `profiles` in the `UserDetails` async function, then pass as props to `ProfileView`.
- Tab state is `useState` only — no `searchParams`, no URL sync.
- Each page owns its own `Container` per project convention — `app/settings/page.tsx` does not rely on layout for padding.
