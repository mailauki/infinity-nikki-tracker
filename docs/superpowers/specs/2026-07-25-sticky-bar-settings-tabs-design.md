# StickyBar Phase 2 — Settings Tabs Design

**Date:** 2026-07-25
**Status:** Approved (pending spec review)
**Branch:** layout-shell-consolidation (continues the StickyBar work; PR #278)

## Goal

Move the Settings page's tab selector (`<Tabs>`) into the `StickyBar` (the sticky sub-toolbar
under the fixed AppBar), while the tab _content_ stays in the page. Because the tabs and their
content share `tab` state and would live in different React subtrees after the split, a small
settings-local context carries that state across the portal boundary.

**Phase 2** of a phased effort. Out of scope: the outfit/eureka slug toggle-button-groups
(Phase 3).

## Chosen decisions (from brainstorming)

- **Shared state:** a settings-local React context (`SettingsTabsProvider`) holds `tab`/`setTab`,
  mirroring the app's cross-portal state pattern (`useSidebar`, etc.). Not URL/searchParam-based;
  not prop-threading.
- **Placement:** the provider + bar + content switch all live inside a restructured
  `SettingsTabs` client component. `page.tsx` is essentially unchanged (still renders
  `<SettingsTabs …props />` inside `<PageShell maxWidth="md">`).
- **Tab-state ownership:** the PROVIDER owns the full concern — initial value keyed on
  `isLoggedIn`, and the normalization `useEffect` that forces `appearance` when logged out. The
  bar and content are dumb consumers. `<Tab>` visibility (`isLoggedIn && <Tab …>`) stays in the
  bar (it's rendering, not state).
- **Styling:** DROP the `<Tabs>`' own `borderBottom` (the sticky bar already provides a bottom
  divider — keeping it would double up). Keep the `flexGrow` behavior on `<Tabs>` and each
  `<Tab>`.

## Architecture

Split the current single `SettingsTabs` into a provider + bar + content, plus a thin wrapper.

### New: `app/settings/settings-tabs-context.tsx` (`'use client'`)

```tsx
'use client'

import * as React from 'react'

export type TabValue = 'profile' | 'appearance' | 'account'

type SettingsTabsContextType = {
  tab: TabValue
  setTab: (tab: TabValue) => void
}

const SettingsTabsContext = React.createContext<SettingsTabsContextType | null>(null)

export function SettingsTabsProvider({
  isLoggedIn,
  children,
}: {
  isLoggedIn: boolean
  children: React.ReactNode
}) {
  const [tab, setTab] = React.useState<TabValue>(isLoggedIn ? 'profile' : 'appearance')

  // Logged-out users only have the Appearance tab; normalize if auth changes.
  React.useEffect(() => {
    if (!isLoggedIn) setTab('appearance')
  }, [isLoggedIn])

  return (
    <SettingsTabsContext.Provider value={{ tab, setTab }}>{children}</SettingsTabsContext.Provider>
  )
}

export function useSettingsTabs() {
  const ctx = React.useContext(SettingsTabsContext)
  if (!ctx) throw new Error('useSettingsTabs must be used within SettingsTabsProvider')
  return ctx
}
```

### Restructured: `app/settings/settings-tabs.tsx` (`'use client'`) — thin wrapper

```tsx
'use client'

import { type User } from '@supabase/supabase-js'
import { SettingsTabsProvider } from './settings-tabs-context'
import SettingsTabsBar from './settings-tabs-bar'
import SettingsTabsContent from './settings-tabs-content'

export default function SettingsTabs({
  isLoggedIn,
  isAdmin,
  isPremium,
  user,
}: {
  isLoggedIn: boolean
  isAdmin: boolean
  isPremium: boolean
  user: User | null
}) {
  return (
    <SettingsTabsProvider isLoggedIn={isLoggedIn}>
      <SettingsTabsBar isLoggedIn={isLoggedIn} />
      <SettingsTabsContent
        isAdmin={isAdmin}
        isLoggedIn={isLoggedIn}
        isPremium={isPremium}
        user={user}
      />
    </SettingsTabsProvider>
  )
}
```

### New: `app/settings/settings-tabs-bar.tsx` (`'use client'`)

Renders the `<Tabs>` into `StickyBar`. Reads `tab`/`setTab` from context. Owns `<Tab>`
visibility. Drops `borderBottom`; keeps `flexGrow`.

```tsx
'use client'

import { Tab, Tabs } from '@mui/material'
import StickyBar from '@/components/sticky-bar'
import { useSettingsTabs, type TabValue } from './settings-tabs-context'

export default function SettingsTabsBar({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { tab, setTab } = useSettingsTabs()

  return (
    <StickyBar>
      <Tabs
        aria-label="Settings tabs"
        sx={{ flexGrow: 1 }}
        value={tab}
        onChange={(_, value: TabValue) => setTab(value)}
      >
        {isLoggedIn && <Tab label="Profile" sx={{ flexGrow: { xs: 1, md: 0 } }} value="profile" />}
        <Tab label="Appearance" sx={{ flexGrow: { xs: 1, md: 0 } }} value="appearance" />
        {isLoggedIn && <Tab label="Account" sx={{ flexGrow: { xs: 1, md: 0 } }} value="account" />}
      </Tabs>
    </StickyBar>
  )
}
```

### New: `app/settings/settings-tabs-content.tsx` (`'use client'`)

The content switch, reading `tab` from context.

```tsx
'use client'

import { type User } from '@supabase/supabase-js'
import LoginAlert from '@/components/login-alert'
import AppearanceSettings from './appearance-settings'
import AccountSettings from './account-settings'
import ProfileSettings from './profile-settings'
import { useSettingsTabs } from './settings-tabs-context'

export default function SettingsTabsContent({
  isLoggedIn,
  isAdmin,
  isPremium,
  user,
}: {
  isLoggedIn: boolean
  isAdmin: boolean
  isPremium: boolean
  user: User | null
}) {
  const { tab } = useSettingsTabs()

  return (
    <>
      {tab === 'profile' && (isLoggedIn ? <ProfileSettings user={user} /> : <LoginAlert />)}
      {tab === 'appearance' && <AppearanceSettings isLoggedIn={isLoggedIn} isPremium={isPremium} />}
      {tab === 'account' && (isLoggedIn ? <AccountSettings isAdmin={isAdmin} /> : <LoginAlert />)}
    </>
  )
}
```

### `app/settings/page.tsx` — unchanged

Still renders `<SettingsTabs isAdmin=… isLoggedIn=… isPremium=… user=… />` inside
`<PageShell maxWidth="md">`. No change needed.

## Data flow across the portal

`SettingsTabsBar` renders `<Tabs>` into `StickyBar` (portal → shell's sticky container), but
stays in the page tree under `SettingsTabsProvider`, so `useSettingsTabs()` resolves. Clicking a
tab calls `setTab` → context updates → both the bar (active-tab highlight) and
`SettingsTabsContent` (also under the provider) re-render. Same cross-portal shared-state idiom
as the Phase 1 results counts and the sidebar.

## AppBar offset

`/settings` mounts NO `ToolbarSlot` (verified — no toolbar, no settings layout). So it is a
**1-row AppBar** page; the sticky bar pins under the single row (the offset's `hasToolbar`
addend is 0). The StickyBar mechanism already derives this from `hasToolbar` — no new offset
work. (This is the first real exercise of the 1-row offset branch, which the mechanism supported
but Phase 1 pages, being 2-row, did not exercise.)

## Files

- Create: `app/settings/settings-tabs-context.tsx` (provider + `useSettingsTabs` + `TabValue`)
- Create: `app/settings/settings-tabs-bar.tsx` (Tabs → StickyBar)
- Create: `app/settings/settings-tabs-content.tsx` (content switch)
- Modify: `app/settings/settings-tabs.tsx` (becomes the thin wrapper)
- `app/settings/page.tsx` — unchanged (renders `<SettingsTabs>` as before)

## Edge cases

1. **Provider boundary.** Bar and content must both sit under `SettingsTabsProvider`; the wrapper
   renders all three so the hook resolves even though the bar's DOM portals into the shell.
2. **Logged-out normalization.** The provider forces `appearance` when `!isLoggedIn`, and the bar
   hides Profile/Account tabs — a logged-out user can neither land on nor select a gated tab.
   Identical behavior to today, relocated to the provider.
3. **`user` null-safety.** Content passes `user` to `ProfileSettings` only in the logged-in
   branch — unchanged.
4. **1-row offset.** See above; the sticky tabs pin under the 1-row AppBar. Verify visually.
5. **Doubled divider.** With the tabs' `borderBottom` dropped, only the sticky bar's divider
   shows — verify no double line.

## Testing

No test framework — static + manual.

- `yarn tsc --noEmit` and `yarn lint` clean.
- `/settings` logged in: the tab bar renders in the sticky bar (below the AppBar), NOT in the
  page body; Profile/Appearance/Account all present; clicking each switches the content below;
  single divider (no doubled border); tabs pin on scroll.
- `/settings` logged out: only the Appearance tab shows; the content is Appearance; cannot reach
  Profile/Account.
- Confirm the active-tab highlight tracks the shown content (bar and content stay in sync via
  context).

## Out of scope (later phase)

- Outfit/eureka slug toggle-button-groups → StickyBar (Phase 3).
- Any change to the `StickyBar` mechanism itself.
