# Theme Preference Design

**Date:** 2026-06-01  
**Status:** Approved

## Overview

Persist the user's selected theme (`system` | `light` | `dark`) in the `user_preferences` table so it survives page reloads and device changes. The `AppearanceSettings` component loads the saved value on mount and writes it back on every change.

---

## Database

### Migration

Add a `theme` column to `user_preferences`:

```sql
ALTER TABLE user_preferences
  ADD COLUMN theme text NOT NULL DEFAULT 'system'
    CHECK (theme IN ('system', 'light', 'dark'));
```

Existing rows get the default `'system'`. No data migration needed.

### Regenerate types

After applying the migration:

```bash
supabase gen types typescript --project-id $(cat supabase/.temp/project-ref) > lib/types/supabase.ts
```

---

## Type Changes

### `lib/types/eureka.ts`

Add `'theme'` to the `UserPreferences` Pick:

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

### `lib/preferences.ts`

Add `theme: 'system'` to `DEFAULT_PREFERENCES`:

```ts
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

---

## Data Access

### `hooks/data/preferences.ts`

Add `theme` to the select string:

```ts
.select(
  'group_by_set, show_by_color, dashboard_view, dashboard_tab, eureka_set_filter, eureka_category, eureka_obtained_filter, eureka_color, eureka_rarity, theme'
)
```

### `app/api/preferences/route.ts`

Add `theme` to the select string (same change as above — this route is the client-side fetch path):

```ts
.select(
  'group_by_set, show_by_color, dashboard_view, dashboard_tab, eureka_set_filter, eureka_category, eureka_obtained_filter, eureka_color, eureka_rarity, theme'
)
```

---

## Server Action

### `app/actions/preferences.ts`

Add a new `updateTheme` action following the existing `upsertPreference` pattern:

```ts
export async function updateTheme(value: 'system' | 'light' | 'dark') {
  await upsertPreference({ theme: value })
}
```

---

## UI

### `components/settings/appearance-settings.tsx`

Two changes:

1. **Load saved theme on mount** — fetch `GET /api/preferences` in a `useEffect` and call `setMode` with the stored value. Only runs for logged-in users; guests get the MUI default.

2. **Persist on change** — in the `onChange` handler, call `updateTheme(value)` (Server Action) in addition to `setMode(value)`.

The component is `'use client'` and has no access to server-side auth, so it uses `fetch('/api/preferences')` to load preferences. The API route already returns `DEFAULT_PREFERENCES` for unauthenticated users (which has `theme: 'system'`), so calling it unconditionally is safe — it won't throw for guests, it'll just return the default and `setMode('system')` which is a no-op.

Updated component shape:

```tsx
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

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/<timestamp>_add_theme_preference.sql` | New migration |
| `lib/types/supabase.ts` | Regenerated after migration |
| `lib/types/eureka.ts` | Add `'theme'` to `UserPreferences` Pick |
| `lib/preferences.ts` | Add `theme: 'system'` to `DEFAULT_PREFERENCES` |
| `hooks/data/preferences.ts` | Add `theme` to select string |
| `app/api/preferences/route.ts` | Add `theme` to select string |
| `app/actions/preferences.ts` | Add `updateTheme()` action |
| `components/settings/appearance-settings.tsx` | Load saved theme on mount, persist on change |

---

## Key Constraints

- `updateTheme` is a Server Action called directly from the Client Component — no API route needed for writes, consistent with how all other preference updates work.
- The `useEffect` dependency array is intentionally empty (`[]`) — we only want to load the saved preference once on mount, not re-run when `mode` changes (that would cause an infinite loop).
- The `fetch('/api/preferences')` call is fire-and-forget with a silent `.catch(() => {})` — if it fails, the user's current MUI-managed theme stays as-is. No error state needed since theme preference loading is non-critical.
- `setMode` is called with the DB value only if it differs from the current `mode` — avoids a no-op re-render on first load when they already match.
