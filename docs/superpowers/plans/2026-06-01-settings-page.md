# Settings Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/settings` page with Profile, Appearance, and Account tabs, and convert `/profile` to a read-only view.

**Architecture:** `/settings` is a Server Component that fetches auth and passes `isLoggedIn` + `user` to a `'use client'` `SettingsTabs` component that manages active tab with `useState`. Profile and Account tabs are hidden from guests; Appearance is always visible. `/profile` is stripped to a read-only server-rendered view.

**Tech Stack:** Next.js 15 App Router, MUI v7 (`Tabs`, `Tab`, `ToggleButtonGroup`, `Dialog`), Supabase SSR client, `useColorScheme()` from MUI, Supabase `auth.updateUser()` from browser client, Supabase `auth.admin.deleteUser()` via Server Action.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/supabase/admin.ts` | **Create** | Supabase admin client with service role key |
| `app/settings/actions.ts` | **Create** | `deleteAccount()` Server Action |
| `app/settings/page.tsx` | **Create** | Server Component — fetch auth, render `SettingsTabs` |
| `components/settings/settings-tabs.tsx` | **Create** | `'use client'` tab container with `useState` |
| `components/settings/appearance-settings.tsx` | **Create** | Inline `ToggleButtonGroup` theme picker |
| `components/settings/account-settings.tsx` | **Create** | Change email, change password, delete account |
| `components/settings/profile-settings.tsx` | **Create** | Wraps `ProfileForm` with `alwaysEdit={true}` |
| `components/forms/auth/profile-form.tsx` | **Modify** | Add `alwaysEdit?: boolean` prop |
| `app/profile/page.tsx` | **Modify** | Strip to read-only view with server-fetched profile data |

---

## Task 1: Supabase Admin Client

**Files:**
- Create: `lib/supabase/admin.ts`

- [ ] **Step 1: Create the admin client**

```ts
// lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

- [ ] **Step 2: Verify env var exists in `.env.local`**

Open `.env.local` and confirm `SUPABASE_SERVICE_ROLE_KEY` is present. If not, get it from the Supabase dashboard → Project Settings → API → `service_role` key and add it. This key must **never** be prefixed `NEXT_PUBLIC_` — it is server-only.

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/admin.ts
git commit -m "feat: add supabase admin client for service-role operations"
```

---

## Task 2: Delete Account Server Action

**Files:**
- Create: `app/settings/actions.ts`

The Server Action uses the admin client (service role) to delete the user, then signs them out and redirects to `/`.

- [ ] **Step 1: Create the actions file**

```ts
// app/settings/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function deleteAccount() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(user.id)

  if (error) throw new Error(error.message)

  await supabase.auth.signOut()
  redirect('/')
}
```

- [ ] **Step 2: Verify type-check passes**

```bash
yarn tsc --noEmit
```

Expected: no errors relating to `admin.ts` or `actions.ts`.

- [ ] **Step 3: Commit**

```bash
git add app/settings/actions.ts
git commit -m "feat: add deleteAccount server action"
```

---

## Task 3: Add `alwaysEdit` Prop to `ProfileForm`

**Files:**
- Modify: `components/forms/auth/profile-form.tsx`

Currently `ProfileForm` branches on `profileEdit?.isEditing` to show either `ProfileView` or the edit form. Adding `alwaysEdit` skips that check.

- [ ] **Step 1: Add the prop to the signature**

In `components/forms/auth/profile-form.tsx`, change the props interface from:

```ts
export default function ProfileForm({
  user,
  isAdmin = false,
}: {
  user: User | null
  isAdmin?: boolean
})
```

to:

```ts
export default function ProfileForm({
  user,
  isAdmin = false,
  alwaysEdit = false,
}: {
  user: User | null
  isAdmin?: boolean
  alwaysEdit?: boolean
})
```

- [ ] **Step 2: Guard the `ProfileView` branch with `alwaysEdit`**

Find this block (around line 85):

```ts
  if (!profileEdit?.isEditing) {
    return (
      <ProfileView
        avatar_url={avatar_url}
        fullname={fullname}
        isAdmin={isAdmin}
        loadError={loadError}
        user={user}
        username={username}
      />
    )
  }
```

Change it to:

```ts
  if (!alwaysEdit && !profileEdit?.isEditing) {
    return (
      <ProfileView
        avatar_url={avatar_url}
        fullname={fullname}
        isAdmin={isAdmin}
        loadError={loadError}
        user={user}
        username={username}
      />
    )
  }
```

- [ ] **Step 3: Verify type-check passes**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/forms/auth/profile-form.tsx
git commit -m "feat: add alwaysEdit prop to ProfileForm"
```

---

## Task 4: Profile Settings Component

**Files:**
- Create: `components/settings/profile-settings.tsx`

This is a thin wrapper. It does NOT need `ProfileEditProvider` — `alwaysEdit={true}` bypasses the context check entirely.

- [ ] **Step 1: Create the component**

```tsx
// components/settings/profile-settings.tsx
'use client'

import { type User } from '@supabase/supabase-js'
import ProfileForm from '@/components/forms/auth/profile-form'

export default function ProfileSettings({ user }: { user: User | null }) {
  return <ProfileForm alwaysEdit user={user} />
}
```

- [ ] **Step 2: Verify type-check passes**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/settings/profile-settings.tsx
git commit -m "feat: add ProfileSettings component"
```

---

## Task 5: Appearance Settings Component

**Files:**
- Create: `components/settings/appearance-settings.tsx`

Renders a `ToggleButtonGroup` with System / Light / Dark options. Uses `useColorScheme()` from MUI — NOT `useTheme().palette.mode`, which doesn't re-render in CSS variables mode.

- [ ] **Step 1: Create the component**

```tsx
// components/settings/appearance-settings.tsx
'use client'

import { Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import BrightnessMediumIcon from '@mui/icons-material/BrightnessMedium'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { useColorScheme } from '@mui/material/styles'

const modes = [
  { value: 'system', label: 'System', icon: <BrightnessMediumIcon fontSize="small" /> },
  { value: 'light', label: 'Light', icon: <LightModeIcon fontSize="small" /> },
  { value: 'dark', label: 'Dark', icon: <DarkModeIcon fontSize="small" /> },
] as const

export default function AppearanceSettings() {
  const { mode, setMode } = useColorScheme()

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1">Theme</Typography>
      <ToggleButtonGroup
        exclusive
        aria-label="theme"
        value={mode ?? 'system'}
        onChange={(_, value) => {
          if (value) setMode(value)
        }}
      >
        {modes.map(({ value, label, icon }) => (
          <ToggleButton key={value} aria-label={label} sx={{ gap: 1, px: 2 }} value={value}>
            {icon}
            {label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  )
}
```

- [ ] **Step 2: Verify type-check passes**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/settings/appearance-settings.tsx
git commit -m "feat: add AppearanceSettings component with inline theme toggle"
```

---

## Task 6: Account Settings Component

**Files:**
- Create: `components/settings/account-settings.tsx`

Three sections: change email, change password, danger zone. Each uses `supabase.auth.updateUser()` from the browser client, except delete which calls the `deleteAccount` Server Action.

- [ ] **Step 1: Create the component**

```tsx
// components/settings/account-settings.tsx
'use client'

import { useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { createClient } from '@/lib/supabase/client'
import { deleteAccount } from '@/app/settings/actions'

function ChangeEmailSection() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ email })
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setEmail('')
    }
    setLoading(false)
  }

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1">Change email</Typography>
      <Stack component="form" spacing={1} onSubmit={handleSubmit}>
        <TextField
          label="New email"
          size="small"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {success && <Alert severity="success">Confirmation sent to your new email</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        <Button disabled={loading || !email} type="submit" variant="outlined">
          {loading ? 'Saving…' : 'Update email'}
        </Button>
      </Stack>
    </Stack>
  )
}

function ChangePasswordSection() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mismatch = confirm.length > 0 && password !== confirm

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (mismatch) return
    setLoading(true)
    setError(null)
    setSuccess(false)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setPassword('')
      setConfirm('')
    }
    setLoading(false)
  }

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1">Change password</Typography>
      <Stack component="form" spacing={1} onSubmit={handleSubmit}>
        <TextField
          label="New password"
          size="small"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <TextField
          error={mismatch}
          helperText={mismatch ? 'Passwords do not match' : undefined}
          label="Confirm password"
          size="small"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {success && <Alert severity="success">Password updated</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        <Button disabled={loading || !password || mismatch} type="submit" variant="outlined">
          {loading ? 'Saving…' : 'Update password'}
        </Button>
      </Stack>
    </Stack>
  )
}

function DangerZoneSection() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    await deleteAccount()
  }

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1">Danger zone</Typography>
      <Button color="error" sx={{ alignSelf: 'flex-start' }} variant="outlined" onClick={() => setOpen(true)}>
        Delete account
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Delete account?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete your account and all your data. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={loading} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button color="error" disabled={loading} variant="contained" onClick={handleDelete}>
            {loading ? 'Deleting…' : 'Delete account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default function AccountSettings() {
  return (
    <Stack spacing={3}>
      <ChangeEmailSection />
      <Divider />
      <ChangePasswordSection />
      <Divider />
      <DangerZoneSection />
    </Stack>
  )
}
```

- [ ] **Step 2: Verify type-check passes**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/settings/account-settings.tsx
git commit -m "feat: add AccountSettings component (email, password, delete)"
```

---

## Task 7: Settings Tabs Component

**Files:**
- Create: `components/settings/settings-tabs.tsx`

`'use client'` tab container. Manages active tab with `useState`. Profile and Account tabs are hidden from guests. Guests who reach those tabs (impossible via UI, but defensive) see `<LoginAlert />`.

- [ ] **Step 1: Create the component**

```tsx
// components/settings/settings-tabs.tsx
'use client'

import { useState } from 'react'
import { Box, Tab, Tabs } from '@mui/material'
import { type User } from '@supabase/supabase-js'
import LoginAlert from '@/components/login-alert'
import AppearanceSettings from './appearance-settings'
import AccountSettings from './account-settings'
import ProfileSettings from './profile-settings'

type TabValue = 'profile' | 'appearance' | 'account'

export default function SettingsTabs({
  isLoggedIn,
  user,
}: {
  isLoggedIn: boolean
  user: User | null
}) {
  const [tab, setTab] = useState<TabValue>(isLoggedIn ? 'profile' : 'appearance')

  return (
    <Box>
      <Tabs
        aria-label="Settings tabs"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        value={tab}
        onChange={(_, value: TabValue) => setTab(value)}
      >
        {isLoggedIn && <Tab label="Profile" value="profile" />}
        <Tab label="Appearance" value="appearance" />
        {isLoggedIn && <Tab label="Account" value="account" />}
      </Tabs>

      {tab === 'profile' && (isLoggedIn ? <ProfileSettings user={user} /> : <LoginAlert />)}
      {tab === 'appearance' && <AppearanceSettings />}
      {tab === 'account' && (isLoggedIn ? <AccountSettings /> : <LoginAlert />)}
    </Box>
  )
}
```

- [ ] **Step 2: Verify type-check passes**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/settings/settings-tabs.tsx
git commit -m "feat: add SettingsTabs component"
```

---

## Task 8: Settings Page

**Files:**
- Create: `app/settings/page.tsx`

Server Component — fetches auth, passes props to `SettingsTabs`.

- [ ] **Step 1: Create the page**

```tsx
// app/settings/page.tsx
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { Suspense } from 'react'
import SettingsTabs from '@/components/settings/settings-tabs'
import { getUserID } from '@/hooks/user'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Settings',
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  )
}

async function SettingsContent() {
  const user_id = await getUserID()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
      <SettingsTabs isLoggedIn={!!user_id} user={user} />
    </Stack>
  )
}
```

- [ ] **Step 2: Start the dev server and open `/settings`**

```bash
yarn dev
```

Open `http://localhost:3000/settings` — verify:
- Guest: only Appearance tab is visible, `ToggleButtonGroup` shows System/Light/Dark
- Clicking a mode option updates the theme immediately

- [ ] **Step 3: Sign in and verify logged-in tabs**

Sign in, navigate to `/settings` — verify:
- Profile, Appearance, Account tabs all visible
- Default tab is Profile
- Profile tab shows the edit form (avatar upload, full name, username)
- Account tab shows change email, change password, delete account sections

- [ ] **Step 4: Commit**

```bash
git add app/settings/page.tsx
git commit -m "feat: add /settings page"
```

---

## Task 9: Update `/profile` to Read-Only

**Files:**
- Modify: `app/profile/page.tsx`

Remove `ProfileForm`. Fetch profile data server-side and pass directly to `ProfileView`.

- [ ] **Step 1: Replace the file contents**

```tsx
// app/profile/page.tsx
import CollectionStats from './collection-stats'
import RecentUpdates from './recent-updates'
import ProfileView from './profile-view'
import { createClient } from '@/lib/supabase/server'
import { getUserID, getUserRole } from '@/hooks/user'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { getColors } from '@/hooks/data/colors'
import { getCategories } from '@/hooks/data/categories'
import { getTrials } from '@/hooks/data/trials'
import { getRecentObtained } from '@/hooks/data/obtained-eureka'

export const metadata: Metadata = {
  title: 'Profile',
}

export default function ProfilePage() {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <UserDetails />
      </Stack>
    </Suspense>
  )
}

async function UserDetails() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/login')
  }

  const role = await getUserRole()
  const user_id = await getUserID()
  const sets = await getEurekaSets()
  const categories = await getCategories()
  const colors = await getColors()
  const trials = await getTrials()
  const recentObtained = user_id ? await getRecentObtained(user_id) : []

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <>
      <ProfileView
        avatar_url={profile?.avatar_url ?? null}
        fullname={profile?.full_name ?? null}
        isAdmin={role === 'admin'}
        loadError={false}
        user={user}
        username={profile?.username ?? null}
      />
      {user_id && (
        <CollectionStats
          categories={categories || []}
          colors={colors || []}
          sets={sets || []}
          trials={trials || []}
        />
      )}
      {user_id && <RecentUpdates items={recentObtained || []} />}
    </>
  )
}
```

- [ ] **Step 2: Verify type-check passes**

```bash
yarn tsc --noEmit
```

Expected: no errors. In particular, confirm `ProfileView` props match exactly (`avatar_url`, `fullname`, `isAdmin`, `loadError`, `user`, `username`).

- [ ] **Step 3: Open `/profile` in the browser**

Navigate to `http://localhost:3000/profile` — verify:
- Shows avatar, full name, username, email (read-only)
- Collection stats grid visible
- Recently updated list visible (if any items obtained)
- No edit button or form fields

- [ ] **Step 4: Commit**

```bash
git add app/profile/page.tsx
git commit -m "refactor: convert /profile to read-only server-rendered view"
```

---

## Task 10: Smoke Test & Cleanup

- [ ] **Step 1: Test the full settings flow while logged in**

1. Go to `/settings` → Profile tab: edit full name → click Update → name updates
2. Go to Appearance tab: toggle Light/Dark/System → theme changes immediately
3. Go to Account tab: enter a new email → click Update email → success alert appears
4. Go to Account tab: enter matching passwords → click Update password → success alert appears
5. Go to `/profile` → confirm read-only view (no edit form)

- [ ] **Step 2: Test as a guest**

1. Sign out, go to `/settings` → only Appearance tab visible
2. Theme toggle works without signing in
3. Go to `/profile` → redirects to `/auth/login`

- [ ] **Step 3: Run lint and format**

```bash
yarn lint:fix && yarn format
```

Expected: no errors.

- [ ] **Step 4: Final type-check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: lint and format settings page implementation"
```
