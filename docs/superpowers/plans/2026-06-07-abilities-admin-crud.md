# Abilities Admin CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full admin CRUD pages for the `abilities` lookup table — list, add, and edit — following the evolutions pattern exactly, plus a DB migration to add `image_url`.

**Architecture:** One Supabase migration adds `image_url` to `abilities`. A new `hooks/data/admin/abilities.ts` provides uncached admin reads. Seven new files under `app/admin/outfits/abilities/` implement the list page (table + list views), add page, and edit page, each mirroring the evolutions structure. The existing `hooks/data/abilities.ts` public hook gets `image_url` added to its select so the outfit-set forms can display ability images in future.

**Tech Stack:** Next.js 15 App Router (Server Components + Server Actions), MUI v7, MUI X DataGrid, Supabase (server client), `useActionState`, `ImageUpload` component, `useFormConfig` form context.

---

## File Map

**New files:**
- `supabase/migrations/20260607000001_add_image_url_to_abilities.sql`
- `hooks/data/admin/abilities.ts`
- `app/admin/outfits/abilities/page.tsx`
- `app/admin/outfits/abilities/loading.tsx`
- `app/admin/outfits/abilities/outfit-ability-view.tsx`
- `app/admin/outfits/abilities/outfit-ability-table.tsx`
- `app/admin/outfits/abilities/outfit-ability-list.tsx`
- `app/admin/outfits/abilities/new/page.tsx`
- `app/admin/outfits/abilities/new/loading.tsx`
- `app/admin/outfits/abilities/new/add-ability-form.tsx`
- `app/admin/outfits/abilities/new/actions.ts`
- `app/admin/outfits/abilities/edit/[slug]/page.tsx`
- `app/admin/outfits/abilities/edit/[slug]/loading.tsx`
- `app/admin/outfits/abilities/edit/[slug]/edit-ability-form.tsx`
- `app/admin/outfits/abilities/edit/[slug]/actions.ts`

**Modified files:**
- `lib/types/outfit.ts` — add `image_url` to `Ability` type
- `hooks/data/abilities.ts` — add `image_url` to select query
- `lib/types/supabase.ts` — regenerated after migration (via CLI command, not manual edit)

---

## Task 1: DB migration — add `image_url` to `abilities`

**Files:**
- Create: `supabase/migrations/20260607000001_add_image_url_to_abilities.sql`

- [ ] Write the migration file:

```sql
ALTER TABLE abilities ADD COLUMN IF NOT EXISTS image_url TEXT;
```

- [ ] Apply the migration to the remote database:

```bash
supabase db push --include-all
```

Expected: `Applying migration 20260607000001_add_image_url_to_abilities.sql... Done`

- [ ] Regenerate TypeScript types:

```bash
supabase gen types typescript --project-id $(cat supabase/.temp/project-ref) > lib/types/supabase.ts
```

Expected: `lib/types/supabase.ts` updated — `abilities.Row` now includes `image_url: string | null`.

- [ ] Verify the type was added — `abilities` Row should now have `image_url`:

```bash
grep -A 6 'abilities: {' lib/types/supabase.ts | grep image_url
```

Expected: `image_url: string | null`

- [ ] Commit:

```bash
git add supabase/migrations/20260607000001_add_image_url_to_abilities.sql lib/types/supabase.ts
git commit -m "feat: add image_url column to abilities table"
```

---

## Task 2: Update `Ability` type and public data hook

**Files:**
- Modify: `lib/types/outfit.ts`
- Modify: `hooks/data/abilities.ts`

- [ ] Update the `Ability` type in `lib/types/outfit.ts` to include `image_url`:

```ts
export type Ability = Pick<Tables<'abilities'>, 'slug' | 'title' | 'image_url'>
```

- [ ] Update the select query in `hooks/data/abilities.ts` to fetch `image_url`:

```ts
import { cache } from 'react'
import { Ability } from '@/lib/types/outfit'
import { createClient } from '@/lib/supabase/server'

export const getAbilities = cache(async () => {
  const supabase = await createClient()

  const { data: abilities } = await supabase
    .from('abilities')
    .select('slug, title, image_url')
    .order('title', { ascending: true })

  return (abilities ?? []) as Ability[]
})
```

- [ ] Run type-check to confirm no errors:

```bash
yarn tsc --noEmit
```

Expected: No errors.

- [ ] Commit:

```bash
git add lib/types/outfit.ts hooks/data/abilities.ts
git commit -m "feat: add image_url to Ability type and public abilities hook"
```

---

## Task 3: Admin data hook

**Files:**
- Create: `hooks/data/admin/abilities.ts`

- [ ] Create the admin hook (no `cache()` — admin reads must not be cached):

```ts
import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/lib/types/supabase'

export type AbilityRaw = Pick<Tables<'abilities'>, 'id' | 'slug' | 'title' | 'image_url'>

export async function getAbilitiesRaw(): Promise<AbilityRaw[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('abilities')
    .select('id, slug, title, image_url')
    .order('title', { ascending: true })

  return (data ?? []) as AbilityRaw[]
}

export async function getAbilityRaw(slug: string): Promise<AbilityRaw | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('abilities')
    .select('id, slug, title, image_url')
    .eq('slug', slug)
    .maybeSingle()

  return data as AbilityRaw | null
}
```

- [ ] Run type-check:

```bash
yarn tsc --noEmit
```

Expected: No errors.

- [ ] Commit:

```bash
git add hooks/data/admin/abilities.ts
git commit -m "feat: add admin abilities data hook"
```

---

## Task 4: List page — table component

**Files:**
- Create: `app/admin/outfits/abilities/outfit-ability-table.tsx`

- [ ] Create the DataGrid table component:

```tsx
'use client'

import { useState } from 'react'
import { Stack } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { DataGrid, GridActionsCellItem, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { navLinksData } from '@/lib/nav-links'
import { AbilityRaw } from '@/hooks/data/admin/abilities'
import ImageUpload from '@/components/forms/image-upload'

type Row = AbilityRaw

interface OutfitAbilityTableProps {
  rows: Row[]
}

export function OutfitAbilityTable({ rows: initialRows }: OutfitAbilityTableProps) {
  const [rows, setRows] = useState<Row[]>(initialRows)
  const editHref = (row: Row) =>
    `${navLinksData.admin.outfits.abilities.edit}/${row.slug}?back=${encodeURIComponent(navLinksData.admin.outfits.abilities.list)}`

  const columns: GridColDef<Row>[] = [
    {
      field: 'id',
      headerName: 'ID',
      type: 'number',
      width: 80,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 64,
      getActions: ({ row }) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon color="secondary" />}
          label="Edit"
          title="Edit"
          onClick={() => window.location.assign(editHref(row))}
        />,
      ],
    },
    {
      field: 'image_url',
      headerName: 'Image',
      width: 100,
      sortable: false,
      renderCell: ({ row }: GridRenderCellParams<Row>) => (
        <Stack sx={{ flex: 1, height: 100, justifyContent: 'center' }}>
          <ImageUpload
            column="image_url"
            slug={row.slug}
            table="abilities"
            url={row.image_url ?? null}
            onUpload={(url) =>
              setRows((prev) =>
                prev.map((r) => (r.slug === row.slug ? { ...r, image_url: url } : r))
              )
            }
          />
        </Stack>
      ),
    },
    {
      field: 'title',
      headerName: 'Title',
      width: 240,
      renderCell: ({ value }: GridRenderCellParams<Row>) => (
        <span style={{ fontWeight: 500 }}>{value}</span>
      ),
    },
    {
      field: 'slug',
      headerName: 'Slug',
      width: 240,
      renderCell: ({ value }: GridRenderCellParams<Row>) => (
        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{value}</span>
      ),
    },
  ]

  return (
    <DataGrid
      disableRowSelectionOnClick
      columns={columns}
      getRowId={(row) => row.id}
      initialState={{
        pagination: { paginationModel: { pageSize: 15 } },
        sorting: { sortModel: [{ field: 'title', sort: 'asc' }] },
      }}
      pageSizeOptions={[6, 8, 15, 20, 30, 50, 100]}
      rowHeight={100}
      rows={rows}
      sx={{ border: 0, bgcolor: 'transparent' }}
    />
  )
}
```

- [ ] Run type-check:

```bash
yarn tsc --noEmit
```

Expected: No errors.

---

## Task 5: List page — list component

**Files:**
- Create: `app/admin/outfits/abilities/outfit-ability-list.tsx`

- [ ] Create the list component:

```tsx
'use client'

import { AbilityRaw } from '@/hooks/data/admin/abilities'
import ListRow from '../../list-row'
import { AdminList } from '../../admin-list'

interface OutfitAbilityListProps {
  rows: AbilityRaw[]
  page?: number
  rowsPerPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
}

export default function OutfitAbilityList({
  rows,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: OutfitAbilityListProps) {
  return (
    <AdminList
      getKey={(ability) => ability.slug}
      page={page}
      renderRow={(row) => (
        <ListRow
          image_url={row.image_url ?? undefined}
          list="admin/outfits/abilities"
          slug={row.slug}
          title={row.title}
          updated_at={null}
        />
      )}
      rows={rows}
      rowsPerPage={rowsPerPage}
      title="Ability"
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  )
}
```

---

## Task 6: List page — view switcher, page, and loading skeleton

**Files:**
- Create: `app/admin/outfits/abilities/outfit-ability-view.tsx`
- Create: `app/admin/outfits/abilities/page.tsx`
- Create: `app/admin/outfits/abilities/loading.tsx`

- [ ] Create the view switcher (client component):

```tsx
'use client'

import { useAdminView } from '../../admin-view-context'
import { AbilityRaw } from '@/hooks/data/admin/abilities'
import { OutfitAbilityTable } from './outfit-ability-table'
import OutfitAbilityList from './outfit-ability-list'
import TableContainer from '../../table-container'

export default function OutfitAbilityView({ abilities }: { abilities: AbilityRaw[] }) {
  const { view } = useAdminView()

  return view === 'table' ? (
    <TableContainer>
      <OutfitAbilityTable rows={abilities} />
    </TableContainer>
  ) : (
    <OutfitAbilityList rows={abilities} />
  )
}
```

- [ ] Create the page (Server Component):

```tsx
import { getAbilitiesRaw } from '@/hooks/data/admin/abilities'
import { Suspense } from 'react'
import OutfitAbilityView from './outfit-ability-view'

export default function OutfitAbilitiesAdminPage() {
  return (
    <Suspense>
      <AdminView />
    </Suspense>
  )
}

async function AdminView() {
  const abilities = await getAbilitiesRaw()

  return <OutfitAbilityView abilities={abilities} />
}
```

- [ ] Create the loading skeleton:

```tsx
import { Skeleton, Stack, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'

export default function OutfitAbilitiesAdminLoading() {
  return (
    <Stack spacing={2} sx={{ pt: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            {Array.from({ length: 4 }).map((_, i) => (
              <TableCell key={i}>
                <Skeleton height={20} variant="text" width={80} />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: 10 }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: 4 }).map((_, j) => (
                <TableCell key={j}>
                  <Skeleton height={20} variant="text" width={j === 0 ? 160 : 80} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Stack>
  )
}
```

- [ ] Run type-check:

```bash
yarn tsc --noEmit
```

Expected: No errors.

- [ ] Commit Tasks 4–6:

```bash
git add app/admin/outfits/abilities/
git commit -m "feat: add abilities admin list page with table and list views"
```

---

## Task 7: Add page — server action

**Files:**
- Create: `app/admin/outfits/abilities/new/actions.ts`

- [ ] Create the `addAbility` server action:

```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/hooks/user'
import { navLinksData } from '@/lib/nav-links'
import { toSlug } from '@/lib/utils'

export async function addAbility(_: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const supabase = await createClient()

  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const slug = (formData.get('slug') as string | null)?.trim() || toSlug(title)

  if (!title) return { error: 'Title is required.' }
  if (!slug) return { error: 'Slug is required.' }

  const { error } = await supabase.from('abilities').insert([{ title, slug }])

  if (error) return { error: error.message }

  if (formData.get('add_another') === 'true')
    return { addAnother: true as const, savedTitle: title }

  redirect(navLinksData.admin.outfits.abilities.list)
}
```

---

## Task 8: Add page — form and page

**Files:**
- Create: `app/admin/outfits/abilities/new/add-ability-form.tsx`
- Create: `app/admin/outfits/abilities/new/page.tsx`
- Create: `app/admin/outfits/abilities/new/loading.tsx`

- [ ] Create the add form (client component):

```tsx
'use client'

import { useActionState, useEffect, useState } from 'react'
import { Alert, IconButton, InputAdornment, Stack, TextField } from '@mui/material'
import { Edit, EditOff } from '@mui/icons-material'
import { toSlug } from '@/lib/utils'
import { useFormConfig } from '@/app/admin/form-context'
import { addAbility } from './actions'
import { navLinksData } from '@/lib/nav-links'

const FORM_ID = 'add-ability'

export default function AddAbilityForm() {
  const { setFormConfig } = useFormConfig()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [editSlug, setEditSlug] = useState(false)

  const [state, action, pending] = useActionState(addAbility, null)

  useEffect(() => {
    setFormConfig({
      formId: FORM_ID,
      backUrl: navLinksData.admin.outfits.abilities.list,
      pending,
      showAddAnother: true,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending])

  useEffect(() => {
    if (state && 'addAnother' in state) {
      setFormConfig({ savedTitle: state.savedTitle })
      setTitle('')
      setSlug('')
      setEditSlug(false)
    }
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!editSlug) setSlug(toSlug(value))
  }

  return (
    <form action={action} id={FORM_ID}>
      <Stack spacing={2} sx={{ maxWidth: 'sm' }}>
        {state?.error && <Alert severity="error">{state.error}</Alert>}

        <TextField
          required
          label="Title"
          name="title"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
        />

        <input name="slug" type="hidden" value={slug} />
        <TextField
          required
          disabled={!editSlug}
          helperText="Auto-generated from title — edit if needed"
          label="Slug"
          slotProps={{
            htmlInput: { style: { fontFamily: 'monospace' } },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setEditSlug(!editSlug)}>
                    {editSlug ? <EditOff /> : <Edit />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
      </Stack>
    </form>
  )
}
```

- [ ] Create the page (Server Component):

```tsx
import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import AddAbilityForm from './add-ability-form'

export const metadata: Metadata = {
  title: 'Add Ability',
}

export default function NewAbilityPage() {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <AddAbilityForm />
      </Stack>
    </Suspense>
  )
}
```

- [ ] Create the loading skeleton:

```tsx
import { Skeleton, Stack } from '@mui/material'

export default function NewAbilityLoading() {
  return (
    <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
      {Array.from({ length: 2 }).map((_, i) => (
        <Stack key={i} spacing={0.5}>
          <Skeleton height={20} variant="text" width={120} />
          <Skeleton height={56} variant="rounded" width="100%" />
        </Stack>
      ))}
      <Skeleton height={36} variant="rounded" width={100} />
    </Stack>
  )
}
```

- [ ] Run type-check:

```bash
yarn tsc --noEmit
```

Expected: No errors.

- [ ] Commit Tasks 7–8:

```bash
git add app/admin/outfits/abilities/new/
git commit -m "feat: add ability add form and page"
```

---

## Task 9: Edit page — server action

**Files:**
- Create: `app/admin/outfits/abilities/edit/[slug]/actions.ts`

- [ ] Create the `editAbility` server action:

```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/hooks/user'
import { navLinksData } from '@/lib/nav-links'

export async function editAbility(
  currentSlug: string,
  backUrl: string,
  _: unknown,
  formData: FormData
) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const supabase = await createClient()

  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const slug = (formData.get('slug') as string | null)?.trim() ?? ''

  if (!title) return { error: 'Title is required.' }
  if (!slug) return { error: 'Slug is required.' }

  const { error } = await supabase
    .from('abilities')
    .update({ title, slug })
    .eq('slug', currentSlug)

  if (error) return { error: error.message }

  redirect(backUrl)
}
```

---

## Task 10: Edit page — form, page, and loading skeleton

**Files:**
- Create: `app/admin/outfits/abilities/edit/[slug]/edit-ability-form.tsx`
- Create: `app/admin/outfits/abilities/edit/[slug]/page.tsx`
- Create: `app/admin/outfits/abilities/edit/[slug]/loading.tsx`

- [ ] Create the edit form (client component):

```tsx
'use client'

import { useActionState, useEffect, useState } from 'react'
import { Alert, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import { Edit, EditOff } from '@mui/icons-material'
import { useFormConfig } from '@/app/admin/form-context'
import { editAbility } from './actions'
import { navLinksData } from '@/lib/nav-links'
import ImageUpload from '@/components/forms/image-upload'

type AbilityRow = {
  slug: string
  title: string
  image_url: string | null
}

const FORM_ID = 'edit-ability'

export default function EditAbilityForm({
  ability,
  back,
}: {
  ability: AbilityRow
  back: string
}) {
  const { setFormConfig } = useFormConfig()
  const [title, setTitle] = useState(ability.title)
  const [slug, setSlug] = useState(ability.slug)
  const [editSlug, setEditSlug] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(ability.image_url)

  const boundAction = editAbility.bind(null, ability.slug, back)
  const [state, action, pending] = useActionState(boundAction, null)

  useEffect(() => {
    setFormConfig({
      formId: FORM_ID,
      backUrl: back ?? navLinksData.admin.outfits.abilities.list,
      pending,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, back])

  return (
    <form action={action} id={FORM_ID}>
      <Stack spacing={2} sx={{ maxWidth: 'sm' }}>
        {state?.error && <Alert severity="error">{state.error}</Alert>}

        <TextField
          required
          label="Title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input name="slug" type="hidden" value={slug} />
        <TextField
          required
          disabled={!editSlug}
          helperText="Edit with caution — changing the slug will break any outfit sets referencing this ability"
          label="Slug"
          slotProps={{
            htmlInput: { style: { fontFamily: 'monospace' } },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setEditSlug(!editSlug)}>
                    {editSlug ? <EditOff /> : <Edit />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />

        <Stack spacing={1}>
          <Typography variant="subtitle2">Image</Typography>
          <ImageUpload
            caption="Ability Image"
            slug={ability.slug}
            table="abilities"
            url={imageUrl}
            onUpload={(url) => setImageUrl(url)}
          />
        </Stack>
      </Stack>
    </form>
  )
}
```

- [ ] Create the edit page (Server Component):

```tsx
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { navLinksData } from '@/lib/nav-links'
import { getAbilityRaw } from '@/hooks/data/admin/abilities'
import EditAbilityForm from './edit-ability-form'

export const metadata: Metadata = {
  title: 'Edit Ability',
}

export default async function EditAbilityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ back?: string }>
}) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditAbility params={params} searchParams={searchParams} />
      </Stack>
    </Suspense>
  )
}

async function EditAbility({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ back?: string }>
}) {
  const { slug } = await params
  const { back: backParam } = await searchParams
  const back = backParam?.startsWith('/admin/')
    ? backParam
    : navLinksData.admin.outfits.abilities.list

  const ability = await getAbilityRaw(slug)

  if (!ability) notFound()

  return <EditAbilityForm ability={ability} back={back} />
}
```

- [ ] Create the loading skeleton:

```tsx
import { Skeleton, Stack } from '@mui/material'

export default function EditAbilityLoading() {
  return (
    <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Stack key={i} spacing={0.5}>
          <Skeleton height={20} variant="text" width={120} />
          <Skeleton height={56} variant="rounded" width="100%" />
        </Stack>
      ))}
      <Skeleton height={36} variant="rounded" width={100} />
    </Stack>
  )
}
```

- [ ] Run type-check:

```bash
yarn tsc --noEmit
```

Expected: No errors.

- [ ] Commit Tasks 9–10:

```bash
git add 'app/admin/outfits/abilities/edit/[slug]/'
git commit -m "feat: add ability edit form and page"
```

---

## Task 11: Smoke-test in the browser

- [ ] Start the dev server:

```bash
yarn dev
```

- [ ] Navigate to `/admin/outfits/abilities` — list should render (empty or with existing data).
- [ ] Click the add button — `/admin/outfits/abilities/new` should load. Fill in a title, verify slug auto-generates, submit. Should redirect back to the list.
- [ ] Click edit on the new row — `/admin/outfits/abilities/edit/<slug>` should load with pre-filled fields. Upload an image, save. Should redirect to list and image should appear.
- [ ] Navigate to `/admin/outfits/sets/new` — the Ability dropdown should still work (existing `getAbilities()` hook unchanged in behaviour).
- [ ] Stop the dev server.

- [ ] Commit any fixes found during testing, then create a PR:

```bash
git add -A
git commit -m "fix: address smoke-test issues in abilities admin pages"  # only if needed
```
