# Theme Preference Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist the user's selected theme (`system` | `light` | `dark`) in `user_preferences.theme` and load it in `AppearanceSettings` on mount.

**Architecture:** A Supabase migration adds the `theme` column; regenerated types flow into `UserPreferences`; a new `updateTheme()` Server Action writes the value; `AppearanceSettings` fetches the saved value from `GET /api/preferences` on mount and calls `updateTheme()` on every change alongside the existing `setMode()` call.

**Tech Stack:** Supabase CLI, Next.js 15 App Router, MUI `useColorScheme`, `'use server'` Server Actions.

---

## File Map

| File                                                          | Action         | Responsibility                                 |
| ------------------------------------------------------------- | -------------- | ---------------------------------------------- |
| `supabase/migrations/20260601000001_add_theme_preference.sql` | **Create**     | Add `theme` column with CHECK constraint       |
| `lib/types/supabase.ts`                                       | **Regenerate** | Reflect new column in generated types          |
| `lib/types/eureka.ts`                                         | **Modify**     | Add `'theme'` to `UserPreferences` Pick        |
| `lib/preferences.ts`                                          | **Modify**     | Add `theme: 'system'` to `DEFAULT_PREFERENCES` |
| `hooks/data/preferences.ts`                                   | **Modify**     | Add `theme` to select string                   |
| `app/api/preferences/route.ts`                                | **Modify**     | Add `theme` to select string                   |
| `app/actions/preferences.ts`                                  | **Modify**     | Add `updateTheme()` action                     |
| `components/settings/appearance-settings.tsx`                 | **Modify**     | Load saved theme on mount, persist on change   |

---

## Task 1: Database Migration

**Files:**

- Create: `supabase/migrations/20260601000001_add_theme_preference.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260601000001_add_theme_preference.sql
ALTER TABLE user_preferences
  ADD COLUMN theme text NOT NULL DEFAULT 'system'
    CHECK (theme IN ('system', 'light', 'dark'));
```

- [ ] **Step 2: Apply the migration**

```bash
supabase db push --include-all
```

Expected: output ends with `Finished supabase db push.` or similar success message. If it asks about remote migrations, use `--include-all` flag as shown.

- [ ] **Step 3: Regenerate TypeScript types**

```bash
supabase gen types typescript --project-id ykfuevyqpjvtxidjnhxm > lib/types/supabase.ts
```

Expected: `lib/types/supabase.ts` is updated. Open it and confirm `user_preferences` now contains a `theme` field (search for `theme`).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260601000001_add_theme_preference.sql lib/types/supabase.ts
git commit -m "feat: add theme column to user_preferences"
```

---

## Task 2: Update Types and Defaults

**Files:**

- Modify: `lib/types/eureka.ts`
- Modify: `lib/preferences.ts`

- [ ] **Step 1: Add `'theme'` to `UserPreferences` in `lib/types/eureka.ts`**

Find the `UserPreferences` type (around line 76). Change it from:

```ts
export type UserPreferences = Pick<
  Tables<'user_preferences'>,
  | 'group_by_set'
  | 'show_by_color'
  | 'dashboard_view'
  | 'dashboard_tab'
  | 'eureka_set_filter'
  | 'eureka_category'
  | 'eureka_obtained_filter'
  | 'eureka_color'
  | 'eureka_rarity'
>
```

To:

```ts
export type UserPreferences = Pick<
  Tables<'user_preferences'>,
  | 'group_by_set'
  | 'show_by_color'
  | 'dashboard_view'
  | 'dashboard_tab'
  | 'eureka_set_filter'
  | 'eureka_category'
  | 'eureka_obtained_filter'
  | 'eureka_color'
  | 'eureka_rarity'
  | 'theme'
>
```

- [ ] **Step 2: Add `theme: 'system'` to `DEFAULT_PREFERENCES` in `lib/preferences.ts`**

Current file:

```ts
import { UserPreferences } from './types/eureka'

export const DEFAULT_PREFERENCES: UserPreferences = {
  group_by_set: true,
  show_by_color: false,
  dashboard_view: 'table',
  dashboard_tab: 'eureka-sets',
  eureka_set_filter: null,
  eureka_category: null,
  eureka_obtained_filter: null,
  eureka_color: null,
  eureka_rarity: null,
}
```

Change to:

```ts
import { UserPreferences } from './types/eureka'

export const DEFAULT_PREFERENCES: UserPreferences = {
  group_by_set: true,
  show_by_color: false,
  dashboard_view: 'table',
  dashboard_tab: 'eureka-sets',
  eureka_set_filter: null,
  eureka_category: null,
  eureka_obtained_filter: null,
  eureka_color: null,
  eureka_rarity: null,
  theme: 'system',
}
```

- [ ] **Step 3: Verify type-check passes**

```bash
yarn tsc --noEmit
```

Expected: no errors. If you see errors about `theme` not existing on `Tables<'user_preferences'>`, the migration in Task 1 was not applied or the types were not regenerated — go back and complete Task 1 first.

- [ ] **Step 4: Commit**

```bash
git add lib/types/eureka.ts lib/preferences.ts
git commit -m "feat: add theme to UserPreferences type and default preferences"
```

---

## Task 3: Update Data Access (Select Strings)

**Files:**

- Modify: `hooks/data/preferences.ts`
- Modify: `app/api/preferences/route.ts`

Both files have a `.select(...)` call that lists every `user_preferences` column by name. Add `theme` to both.

- [ ] **Step 1: Update `hooks/data/preferences.ts`**

Current select string (line 12):

```ts
'group_by_set, show_by_color, dashboard_view, dashboard_tab, eureka_set_filter, eureka_category, eureka_obtained_filter, eureka_color, eureka_rarity'
```

Change to:

```ts
'group_by_set, show_by_color, dashboard_view, dashboard_tab, eureka_set_filter, eureka_category, eureka_obtained_filter, eureka_color, eureka_rarity, theme'
```

- [ ] **Step 2: Update `app/api/preferences/route.ts`**

Current select string (around line 26):

```ts
'group_by_set, show_by_color, dashboard_view, dashboard_tab, eureka_set_filter, eureka_category, eureka_obtained_filter, eureka_color, eureka_rarity'
```

Change to:

```ts
'group_by_set, show_by_color, dashboard_view, dashboard_tab, eureka_set_filter, eureka_category, eureka_obtained_filter, eureka_color, eureka_rarity, theme'
```

- [ ] **Step 3: Verify type-check passes**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add hooks/data/preferences.ts app/api/preferences/route.ts
git commit -m "feat: include theme in user_preferences select queries"
```

---

## Task 4: Add `updateTheme` Server Action

**Files:**

- Modify: `app/actions/preferences.ts`

- [ ] **Step 1: Add `updateTheme` to the actions file**

Open `app/actions/preferences.ts`. At the end of the file, add:

```ts
export async function updateTheme(value: 'system' | 'light' | 'dark') {
  await upsertPreference({ theme: value })
}
```

The full file should look like this after the change:

```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserID } from '@/hooks/user'

async function upsertPreference(updates: Record<string, boolean | string | null>) {
  const user_id = await getUserID()
  if (!user_id) return

  const supabase = await createClient()
  await supabase
    .from('user_preferences')
    .upsert(
      { user_id, ...updates, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
}

export async function updateGroupBySet(value: boolean) {
  await upsertPreference({ group_by_set: value })
}

export async function updateShowByColor(value: boolean) {
  await upsertPreference({ show_by_color: value })
}

export async function updateDashboardView(value: 'list' | 'table') {
  await upsertPreference({ dashboard_view: value })
}

export async function updateDashboardTab(value: 'eureka-sets' | 'eureka-variants' | 'trials') {
  await upsertPreference({ dashboard_tab: value })
}

export async function updateEurekaFilters(filters: {
  eureka_set_filter?: string | null
  eureka_category?: string | null
  eureka_obtained_filter?: string | null
  eureka_color?: string | null
  eureka_rarity?: string | null
}) {
  await upsertPreference(filters as Record<string, string | null>)
}

export async function updateTheme(value: 'system' | 'light' | 'dark') {
  await upsertPreference({ theme: value })
}
```

- [ ] **Step 2: Verify type-check passes**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/actions/preferences.ts
git commit -m "feat: add updateTheme server action"
```

---

## Task 5: Update `AppearanceSettings` Component

**Files:**

- Modify: `components/settings/appearance-settings.tsx`

Replace the entire file with the version that loads the saved theme on mount and persists on change:

- [ ] **Step 1: Replace the component**

```tsx
// components/settings/appearance-settings.tsx
'use client'

import { useEffect } from 'react'
import { Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import BrightnessMediumIcon from '@mui/icons-material/BrightnessMedium'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { useColorScheme } from '@mui/material/styles'
import { updateTheme } from '@/app/actions/preferences'

const modes = [
  { value: 'system', label: 'System', icon: <BrightnessMediumIcon fontSize="small" /> },
  { value: 'light', label: 'Light', icon: <LightModeIcon fontSize="small" /> },
  { value: 'dark', label: 'Dark', icon: <DarkModeIcon fontSize="small" /> },
] as const

export default function AppearanceSettings() {
  const { mode, setMode } = useColorScheme()

  useEffect(() => {
    fetch('/api/preferences')
      .then((res) => res.json())
      .then((prefs) => {
        if (prefs.theme && prefs.theme !== mode) {
          setMode(prefs.theme)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1">Theme</Typography>
      <ToggleButtonGroup
        exclusive
        aria-label="theme"
        value={mode ?? 'system'}
        onChange={(_, value) => {
          if (!value) return
          setMode(value)
          updateTheme(value)
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

**Important notes:**

- `useEffect` dependency array is intentionally `[]` — load saved preference once on mount only
- `prefs.theme !== mode` guard prevents a no-op `setMode` call when they already match
- `updateTheme(value)` is a Server Action imported directly — it's a no-op for guests (returns early if `getUserID()` returns null)
- `.catch(() => {})` silently ignores fetch failures — theme loading is non-critical

- [ ] **Step 2: Verify type-check passes**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run lint and format**

```bash
yarn lint:fix && yarn format
```

- [ ] **Step 4: Commit**

```bash
git add components/settings/appearance-settings.tsx
git commit -m "feat: load and persist theme preference in AppearanceSettings"
```

---

## Task 6: Manual Verification

- [ ] **Step 1: Start the dev server**

```bash
yarn dev
```

- [ ] **Step 2: Test as a logged-in user**

1. Navigate to `http://localhost:3000/settings`
2. Go to the Appearance tab
3. Select **Dark** — theme changes immediately
4. Hard-refresh the page (`Cmd+Shift+R` / `Ctrl+Shift+R`) — theme should still be Dark
5. Navigate away and back to `/settings` — Appearance tab should show Dark selected
6. Select **System** — theme changes to system preference, preference saved

- [ ] **Step 3: Verify in Supabase dashboard**

Open the Supabase dashboard → Table Editor → `user_preferences`. Confirm your row has `theme` set to the value you last selected.

- [ ] **Step 4: Test as a guest**

1. Sign out, navigate to `/settings` → Appearance tab
2. Toggle between Light/Dark/System — theme changes immediately
3. Hard-refresh — theme resets to system default (expected — guests have no DB row)
4. Confirm no console errors

- [ ] **Step 5: Final type-check and lint**

```bash
yarn tsc --noEmit && yarn lint:fix && yarn format
```

Expected: no errors, no changes.
