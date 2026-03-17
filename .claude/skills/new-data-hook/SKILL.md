---
name: new-data-hook
description: Scaffold a new hooks/data/ file following the project's cache pattern. Ask for table name, whether data is public or auth-scoped, and fields to select.
---

Scaffold a new data hook file following this project's established patterns.

First, ask the user for:

1. The Supabase table name
2. Whether the data is public (no auth needed) or auth-scoped (requires user session)
3. Which fields to select

Then generate the file at `hooks/data/<name>.ts` using the correct pattern:

**Public lookup data** (categories, colors, styles, labels, trials):

- Use `'use cache'` directive + `cacheLife('hours')` or `cacheLife('days')`
- Use `createPublicClient()` from `lib/supabase/public.ts` (no `cookies()` — required inside `use cache`)
- Export a single `get<Name>()` async function

**Auth-dependent data** (eureka sets with obtained, user profiles):

- Use `React cache()` import from `'react'`
- Use `createClient()` from `lib/supabase/server.ts` (cookie-based)
- Guard with `if (!user_id) return data` before user-scoped queries

**Mutations** (admin writes):

- Create under `hooks/data/admin/<name>.ts`
- Do NOT wrap in `cache()` — mutations wrapped in cache() silently no-op on repeated calls
- Use `createClient()` from `lib/supabase/server.ts`
- Call `revalidatePath()` after mutations

Types must come from `lib/types/eureka.ts` (derived from `Tables<>`), not defined inline.
Use relative imports in `hooks/data/` files (not the `@/` alias).
