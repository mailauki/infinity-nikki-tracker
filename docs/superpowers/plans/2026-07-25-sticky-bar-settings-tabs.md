# StickyBar Phase 2 — Settings Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Settings tab selector into `StickyBar` by splitting `SettingsTabs` into a settings-local context (owns tab state) + a bar that renders the `<Tabs>` into `StickyBar` + a content switch, all under the provider.

**Architecture:** A `SettingsTabsProvider` holds `tab`/`setTab` (init keyed on `isLoggedIn` + the logged-out normalization). `SettingsTabsBar` renders `<Tabs>` into `StickyBar` (portal); `SettingsTabsContent` renders the content switch; both consume the context. `SettingsTabs` becomes a thin wrapper mounting all three under the provider. `page.tsx` is unchanged.

**Tech Stack:** Next.js 16 App Router, React 19, MUI v9, TypeScript.

## Global Constraints

- **No test framework in the repo.** Gate is `yarn tsc --noEmit` and `yarn lint` clean, plus the manual check. Do NOT scaffold tests.
- **Package manager: Yarn.** Never npm/pnpm.
- **Prettier:** no semicolons, single quotes, 2-space indent, 100-char width. The PostToolUse hook auto-formats after each edit — let it.
- **Path alias:** `@/` = project root.
- **Branch:** `layout-shell-consolidation` (already checked out). Never push to `main`.
- **Atomic split:** all four files land in ONE task — a half-done split (e.g. wrapper importing a not-yet-created bar) will not compile. Create the three new files, then rewrite the wrapper, then run the gate once.
- **Behavior parity:** tab state, logged-out normalization, tab visibility, and content switching must behave exactly as the pre-split `SettingsTabs`. Only the `<Tabs>`' `borderBottom` is intentionally dropped (the sticky bar provides the divider); `flexGrow` is kept.
- **Scope: Phase 2 only.** Do NOT touch the slug toggle-groups.

## File Structure

- `app/settings/settings-tabs-context.tsx` (create) — `SettingsTabsProvider`, `useSettingsTabs`, `TabValue`.
- `app/settings/settings-tabs-bar.tsx` (create) — `<Tabs>` → `StickyBar`.
- `app/settings/settings-tabs-content.tsx` (create) — content switch.
- `app/settings/settings-tabs.tsx` (rewrite) — thin wrapper.
- `app/settings/page.tsx` — unchanged (do not touch).

---

## Task 1: Split SettingsTabs into context + bar + content + wrapper

**Files:**

- Create: `app/settings/settings-tabs-context.tsx`
- Create: `app/settings/settings-tabs-bar.tsx`
- Create: `app/settings/settings-tabs-content.tsx`
- Rewrite: `app/settings/settings-tabs.tsx`

**Interfaces:**

- Consumes: `StickyBar` (default export of `@/components/sticky-bar`); the existing settings child components `AppearanceSettings`/`AccountSettings`/`ProfileSettings` (default exports, colocated `./`); `LoginAlert` (`@/components/login-alert`); `User` type (`@supabase/supabase-js`).
- Produces: `SettingsTabsProvider`, `useSettingsTabs()` → `{ tab, setTab }`, `type TabValue = 'profile' | 'appearance' | 'account'` (from the context file); `SettingsTabs` default export keeps its existing prop shape `{ isLoggedIn, isAdmin, isPremium, user }` so `page.tsx` needs no change.

- [ ] **Step 1: Create the context**

Create `app/settings/settings-tabs-context.tsx`:

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

- [ ] **Step 2: Create the bar**

Create `app/settings/settings-tabs-bar.tsx`:

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

- [ ] **Step 3: Create the content switch**

Create `app/settings/settings-tabs-content.tsx`:

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

- [ ] **Step 4: Rewrite the wrapper**

Replace the entire contents of `app/settings/settings-tabs.tsx` with:

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

- [ ] **Step 5: Typecheck + lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: clean. `page.tsx` still compiles unchanged (the `SettingsTabs` prop shape is preserved). No new warnings.

- [ ] **Step 6: Manual smoke check**

Run `yarn dev`, open `http://localhost:3000/settings`.

- Logged in: the Profile/Appearance/Account tab bar renders in the STICKY BAR (below the AppBar), not in the page body. Clicking each tab switches the content below. Only ONE divider under the tabs (no doubled border). Tabs pin under the (1-row) AppBar on scroll.
- Logged out: only the Appearance tab shows; content is Appearance; Profile/Account are not reachable.
- The active-tab highlight matches the shown content (bar/content in sync via context).

- [ ] **Step 7: Commit**

```bash
git add app/settings/settings-tabs-context.tsx app/settings/settings-tabs-bar.tsx app/settings/settings-tabs-content.tsx app/settings/settings-tabs.tsx
git commit -m "feat(settings): move settings tabs into StickyBar via a tabs context"
```

---

## Task 2: Final gate

**Files:** none (verification only).

- [ ] **Step 1: Static gate**

Run: `yarn tsc --noEmit && yarn lint && yarn build`
Expected: tsc clean; lint 0 errors, no new warnings; build exit 0.

- [ ] **Step 2: Both-auth-states manual check**

Confirm on `/settings`: logged-in shows 3 tabs in the sticky bar with working content switching; logged-out shows only Appearance. The 1-row sticky offset looks correct (tabs pin flush under the single-row AppBar — this is the first page to exercise the 1-row branch). Single divider, no doubled border.

- [ ] **Step 3: Commit (only if a fix was needed)**

If Steps 1–2 required a correction, commit it; otherwise nothing to commit.

---

## Sequencing note

The split is one atomic task (Task 1) because a partial split doesn't compile — the wrapper imports the bar/content, which import the context. Create all three new files, rewrite the wrapper, then gate once. Task 2 is the cross-auth verification. No change to the `StickyBar` mechanism.
