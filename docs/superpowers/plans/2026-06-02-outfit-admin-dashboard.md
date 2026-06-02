# Outfit Admin & Dashboard Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build admin add/edit forms and dashboard table/list views for outfit sets and variants, mirroring the existing eureka admin/dashboard pattern.

**Architecture:** Server Components fetch data via existing hooks and pass serializable props to `'use client'` form and view components. Server Actions handle Supabase writes and redirects. Dashboard uses MUI DataGrid with inline editing backed by new `updateOutfitSet` / `updateOutfitVariant` server actions in `app/dashboard/actions.ts`. No new hooks needed — all data hooks already exist in `hooks/data/`.

**Tech Stack:** Next.js 15 App Router, Supabase, MUI v7 + MUI X DataGrid, TypeScript, React `useActionState`, `'use server'` actions

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Modify | `lib/types/props.ts` | Add `outfits` to `DashboardLinks` type |
| Modify | `lib/nav-links.tsx` | Add `dashboard.outfits.*` links + dashboard nav sub-items |
| Modify | `app/dashboard/actions.ts` | Add `updateOutfitSet`, `updateOutfitVariant` |
| Modify | `app/dashboard/page.tsx` | Add Outfit Sets + Outfit Variants stat cards |
| Create | `app/dashboard/outfit-set-table.tsx` | DataGrid for outfit sets (inline edit) |
| Create | `app/dashboard/outfit-set-list.tsx` | List view for outfit sets |
| Create | `app/dashboard/outfit-variant-table.tsx` | DataGrid for outfit variants (inline edit) |
| Create | `app/dashboard/outfit-variant-list.tsx` | List view for outfit variants |
| Create | `app/dashboard/outfits/sets/page.tsx` | Server Component — fetches and renders outfit sets view |
| Create | `app/dashboard/outfits/sets/outfit-set-view.tsx` | Client toggle (table / list) |
| Create | `app/dashboard/outfits/variants/page.tsx` | Server Component — fetches and renders outfit variants view |
| Create | `app/dashboard/outfits/variants/outfit-variant-view.tsx` | Client toggle (table / list) |
| Create | `app/(admin)/outfits/sets/actions.ts` | `addOutfitSet`, `editOutfitSet` server actions |
| Create | `app/(admin)/outfits/sets/new/page.tsx` | Server Component — fetches lookup data |
| Create | `app/(admin)/outfits/sets/new/add-outfit-set-form.tsx` | Add outfit set form |
| Create | `app/(admin)/outfits/sets/edit/[slug]/page.tsx` | Server Component — fetches set + lookup data |
| Create | `app/(admin)/outfits/sets/edit/[slug]/edit-outfit-set-form.tsx` | Edit outfit set form |
| Create | `app/(admin)/outfits/variants/actions.ts` | `addOutfitVariant`, `editOutfitVariant` server actions |
| Create | `app/(admin)/outfits/variants/new/page.tsx` | Server Component — fetches lookup data |
| Create | `app/(admin)/outfits/variants/new/add-outfit-variant-form.tsx` | Add outfit variant form |
| Create | `app/(admin)/outfits/variants/edit/[slug]/page.tsx` | Server Component — fetches variant + lookup data |
| Create | `app/(admin)/outfits/variants/edit/[slug]/edit-outfit-variant-form.tsx` | Edit outfit variant form |

---

## Task 1: Types and nav links

**Files:**
- Modify: `lib/types/props.ts`
- Modify: `lib/nav-links.tsx`

- [ ] **Step 1: Extend `DashboardLinks` in `lib/types/props.ts`**

Replace the existing `DashboardLinks` type:

```typescript
export type DashboardLinks = {
  eureka: { sets: DashboardLink; variants: DashboardLink; trials: DashboardLink }
  outfits: { sets: DashboardLink; variants: DashboardLink }
}
```

- [ ] **Step 2: Add outfit entries to `navLinksData` in `lib/nav-links.tsx`**

In the `dashboard` object, add the `outfits` key after `eureka`:

```typescript
outfits: {
  sets: {
    add: '/outfits/sets/new',
    edit: '/outfits/sets/edit',
  },
  variants: {
    add: '/outfits/variants/new',
    edit: '/outfits/variants/edit',
  },
},
```

In the `navSecondary` Dashboard entry's `items` array, add two items after the existing three:

```typescript
{ title: 'Outfit Sets', url: '/dashboard/outfits/sets' },
{ title: 'Outfit Variants', url: '/dashboard/outfits/variants' },
```

- [ ] **Step 3: Type-check**

```bash
yarn tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add lib/types/props.ts lib/nav-links.tsx
git commit -m "feat: extend DashboardLinks type and nav links for outfit admin/dashboard"
```

---

## Task 2: Dashboard server actions for inline editing

**Files:**
- Modify: `app/dashboard/actions.ts`

- [ ] **Step 1: Add `updateOutfitSet` and `updateOutfitVariant` to `app/dashboard/actions.ts`**

Append after the existing `updateEurekaVariant` function:

```typescript
export async function updateOutfitSet(
  id: number,
  fields: {
    title?: string
    description?: string | null
    rarity?: number | null
    style?: string | null
    label?: string | null
    ability?: string | null
  }
) {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('outfit_sets')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateOutfitVariant(
  id: number,
  fields: {
    outfit_set?: string | null
    outfit_category?: string | null
    evolution?: string | null
    default?: boolean
  }
) {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('outfit_variants')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
```

- [ ] **Step 2: Type-check**

```bash
yarn tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/actions.ts
git commit -m "feat: add updateOutfitSet and updateOutfitVariant dashboard server actions"
```

---

## Task 3: Dashboard stat cards

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Update `app/dashboard/page.tsx`**

Replace the entire file content:

```typescript
import { Suspense } from 'react'
import { getAdminData } from '@/hooks/data/user'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { getOutfitSets } from '@/hooks/data/outfit-sets'
import { getOutfitVariantsRaw } from '@/hooks/data/admin/outfit-variants'
import { getUserRole } from '@/hooks/user'
import { Metadata } from 'next'
import { Box } from '@mui/material'
import { StatCard } from './stat-card'
import DashboardToolBar from './dashboard-toolbar'
import { navLinksData } from '@/lib/nav-links'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  )
}

async function DashboardContent() {
  const [eurekaSets, { eurekaVariants, trials }, outfitSets, outfitVariants, role] =
    await Promise.all([
      getEurekaSets(),
      getAdminData(),
      getOutfitSets(),
      getOutfitVariantsRaw(),
      getUserRole(),
    ])

  const isAdmin = role === 'admin'

  return (
    <>
      {isAdmin && <DashboardToolBar />}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          gap: 2,
          pt: 4,
        }}
      >
        <StatCard
          addHref={isAdmin ? navLinksData.dashboard.eureka.sets.add : undefined}
          count={eurekaSets?.length ?? 0}
          title="Eureka Sets"
        />
        <StatCard
          addHref={isAdmin ? navLinksData.dashboard.eureka.variants.add : undefined}
          count={eurekaVariants?.length ?? 0}
          title="Eureka Variants"
        />
        <StatCard
          addHref={isAdmin ? navLinksData.dashboard.eureka.trials.add : undefined}
          count={trials?.length ?? 0}
          title="Trials"
        />
        <StatCard
          addHref={isAdmin ? navLinksData.dashboard.outfits.sets.add : undefined}
          count={outfitSets?.length ?? 0}
          title="Outfit Sets"
        />
        <StatCard
          addHref={isAdmin ? navLinksData.dashboard.outfits.variants.add : undefined}
          count={outfitVariants?.length ?? 0}
          title="Outfit Variants"
        />
      </Box>
    </>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
yarn tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: add Outfit Sets and Outfit Variants stat cards to dashboard"
```

---

## Task 4: Outfit set dashboard table and list

**Files:**
- Create: `app/dashboard/outfit-set-table.tsx`
- Create: `app/dashboard/outfit-set-list.tsx`

- [ ] **Step 1: Create `app/dashboard/outfit-set-table.tsx`**

```typescript
'use client'

import { useCallback, useState } from 'react'
import { Box, Chip, IconButton, Stack, Tooltip } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Category } from '@mui/icons-material'
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridRenderCellParams,
  GridRowId,
  GridRowModes,
  GridRowModesModel,
} from '@mui/x-data-grid'
import { formatDate, toSlug, toTitle } from '@/lib/utils'
import { navLinksData } from '@/lib/nav-links'
import { Ability, Evolution, OutfitSet } from '@/lib/types/outfit'
import { Style, Label } from '@/lib/types/eureka'
import LazyAvatar from '@/components/eureka/lazy-avatar'
import RarityStars from '@/components/rarity-stars'
import { updateOutfitSet } from '@/app/dashboard/actions'

type Row = OutfitSet

interface OutfitSetTableProps {
  rows: Row[]
  styles: Style[]
  labels: Label[]
  abilities: Ability[]
}

const LOCKED_FIELDS = ['slug', 'image_url', 'evolutions', 'updated_at']

function LockedCell({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <Tooltip title="Edit on full form">
      <IconButton href={href} size="small" sx={{ borderRadius: 1, px: 0.5, opacity: 0.5 }}>
        {children}
      </IconButton>
    </Tooltip>
  )
}

export function OutfitSetTable({ rows: initialRows, styles, labels, abilities }: OutfitSetTableProps) {
  const [rows, setRows] = useState<Row[]>(initialRows)
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({})

  const editHref = (row: Row) =>
    `${navLinksData.dashboard.outfits.sets.edit}/${row.slug ?? toSlug(row.title)}`

  const isEditing = (id: GridRowId) => rowModesModel[id]?.mode === GridRowModes.Edit

  const handleEditClick = useCallback(
    (id: GridRowId) => () => setRowModesModel((m) => ({ ...m, [id]: { mode: GridRowModes.Edit } })),
    []
  )

  const handleSaveClick = useCallback(
    (id: GridRowId) => () => setRowModesModel((m) => ({ ...m, [id]: { mode: GridRowModes.View } })),
    []
  )

  const handleCancelClick = useCallback(
    (id: GridRowId) => () =>
      setRowModesModel((m) => ({
        ...m,
        [id]: { mode: GridRowModes.View, ignoreModifications: true },
      })),
    []
  )

  const processRowUpdate = useCallback(async (newRow: Row, oldRow: Row) => {
    try {
      await updateOutfitSet(newRow.id, {
        title: newRow.title,
        description: newRow.description,
        rarity: newRow.rarity,
        style: newRow.style,
        label: newRow.label,
        ability: newRow.ability,
      })
      setRows((prev) => prev.map((r) => (r.id === newRow.id ? newRow : r)))
      return newRow
    } catch {
      return oldRow
    }
  }, [])

  const columns: GridColDef<Row>[] = [
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 96,
      getActions: ({ id, row }) =>
        isEditing(id)
          ? [
              <GridActionsCellItem
                key="save"
                icon={<SaveIcon color="primary" />}
                label="Save"
                title="Save"
                onClick={handleSaveClick(id)}
              />,
              <GridActionsCellItem
                key="cancel"
                icon={<CancelIcon />}
                label="Cancel"
                title="Cancel"
                onClick={handleCancelClick(id)}
              />,
            ]
          : [
              <GridActionsCellItem
                key="edit"
                icon={<EditIcon color="secondary" />}
                label="Edit row"
                title="Edit row"
                onClick={handleEditClick(id)}
              />,
              <GridActionsCellItem
                key="open"
                icon={<OpenInNewIcon color="secondary" />}
                label="View page"
                title="View page"
                onClick={() => (window.location.href = `/outfits/${row.slug}`)}
              />,
            ],
    },
    {
      field: 'image_url',
      headerName: 'Image',
      width: 64,
      sortable: false,
      renderCell: ({ row }: GridRenderCellParams<Row>) => (
        <Stack justifyContent="center" sx={{ flex: 1, height: 52 }}>
          {isEditing(row.id) ? (
            <LockedCell href={editHref(row)}>
              <LazyAvatar
                alt={row.title || 'Image'}
                color="transparent"
                size="sm"
                src={row.image_url ?? ''}
                sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
              >
                <Category fontSize="inherit" />
              </LazyAvatar>
            </LockedCell>
          ) : (
            <LazyAvatar
              alt={row.title || 'Image'}
              color="transparent"
              size="sm"
              src={row.image_url ?? ''}
              sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
            >
              <Category fontSize="inherit" />
            </LazyAvatar>
          )}
        </Stack>
      ),
    },
    {
      field: 'title',
      headerName: 'Title',
      width: 200,
      editable: true,
      renderCell: ({ value }: GridRenderCellParams<Row>) => (
        <span style={{ fontWeight: 500 }}>{value}</span>
      ),
    },
    {
      field: 'slug',
      headerName: 'Slug',
      width: 200,
      renderCell: ({ row, value }: GridRenderCellParams<Row>) =>
        isEditing(row.id) ? (
          <LockedCell href={editHref(row)}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{value}</span>
          </LockedCell>
        ) : (
          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{value}</span>
        ),
    },
    {
      field: 'rarity',
      headerName: 'Rarity',
      width: 120,
      editable: true,
      type: 'singleSelect',
      valueOptions: [2, 3, 4, 5],
      renderCell: ({ value }: GridRenderCellParams<Row>) =>
        value ? (
          <Stack justifyContent="center" sx={{ flex: 1, height: 52, color: 'text.secondary' }}>
            <RarityStars rarity={value} />
          </Stack>
        ) : (
          '—'
        ),
    },
    {
      field: 'style',
      headerName: 'Style',
      width: 120,
      editable: true,
      type: 'singleSelect',
      valueOptions: styles.map((s) => ({ value: s.slug, label: toTitle(s.title ?? '') })),
      valueFormatter: (value: string | null) => toTitle(value || '—'),
    },
    {
      field: 'label',
      headerName: 'Label',
      width: 120,
      editable: true,
      type: 'singleSelect',
      valueOptions: labels.map((l) => ({ value: l.slug, label: toTitle(l.title ?? '') })),
      valueFormatter: (value: string | null) => toTitle(value || '—'),
    },
    {
      field: 'ability',
      headerName: 'Ability',
      width: 140,
      editable: true,
      type: 'singleSelect',
      valueOptions: [
        { value: '', label: '—' },
        ...abilities.map((a) => ({ value: a.slug, label: toTitle(a.title ?? '') })),
      ],
      valueFormatter: (value: string | null) => toTitle(value || '—'),
    },
    {
      field: 'evolutions',
      headerName: 'Evolutions',
      width: 260,
      sortable: false,
      renderCell: ({ row }: GridRenderCellParams<Row>) => (
        <Stack justifyContent="center" sx={{ flex: 1, height: 52 }}>
          {isEditing(row.id) ? (
            <LockedCell href={editHref(row)}>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', py: 0.5 }}>
                {row.evolutions?.length
                  ? row.evolutions.map((e: Evolution) => (
                      <Chip key={e.slug} label={e.title} size="small" />
                    ))
                  : '—'}
              </Box>
            </LockedCell>
          ) : (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', py: 0.5 }}>
              {row.evolutions?.length
                ? row.evolutions.map((e: Evolution) => (
                    <Chip key={e.slug} label={e.title} size="small" />
                  ))
                : '—'}
            </Box>
          )}
        </Stack>
      ),
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 280,
      sortable: false,
      editable: true,
      valueFormatter: (value: string | null) => value || '—',
    },
    {
      field: 'updated_at',
      headerName: 'Updated',
      width: 120,
      valueFormatter: (value: string | null) => (value ? formatDate(value) : '—'),
    },
  ]

  return (
    <DataGrid
      disableRowSelectionOnClick
      columns={columns}
      editMode="row"
      getRowId={(row) => row.id}
      initialState={{ pagination: { paginationModel: { pageSize: 15 } } }}
      isCellEditable={({ field }) => !LOCKED_FIELDS.includes(field)}
      pageSizeOptions={[6, 8, 15, 20, 30, 50, 100]}
      processRowUpdate={processRowUpdate}
      rowModesModel={rowModesModel}
      rows={rows}
      sx={{ border: 0, bgcolor: 'transparent' }}
      onRowModesModelChange={setRowModesModel}
    />
  )
}
```

- [ ] **Step 2: Create `app/dashboard/outfit-set-list.tsx`**

```typescript
'use client'

import { OutfitSet } from '@/lib/types/outfit'
import { AdminList } from './admin-list'
import ListRow from './list-row'
import { navLinksData } from '@/lib/nav-links'

interface OutfitSetListProps {
  rows: OutfitSet[]
  page?: number
  rowsPerPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
}

export default function OutfitSetList({
  rows,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: OutfitSetListProps) {
  return (
    <AdminList
      addHref={navLinksData.dashboard.outfits.sets.add}
      getKey={(set) => set.id}
      page={page}
      renderRow={(row) => (
        <ListRow
          image_url={row.image_url ?? undefined}
          list="outfits/sets"
          slug={row.slug ?? undefined}
          subheader={row.evolutions?.map((e) => e.title).join(', ') || '—'}
          title={row.title}
          updated_at={row.updated_at}
        />
      )}
      rows={rows}
      rowsPerPage={rowsPerPage}
      title="Outfit Set"
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  )
}
```

- [ ] **Step 3: Type-check**

```bash
yarn tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/outfit-set-table.tsx app/dashboard/outfit-set-list.tsx
git commit -m "feat: add OutfitSetTable and OutfitSetList dashboard components"
```

---

## Task 5: Outfit variant dashboard table and list

**Files:**
- Create: `app/dashboard/outfit-variant-table.tsx`
- Create: `app/dashboard/outfit-variant-list.tsx`

- [ ] **Step 1: Create `app/dashboard/outfit-variant-table.tsx`**

```typescript
'use client'

import { useCallback, useState } from 'react'
import { IconButton, Stack, Tooltip } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Category, CheckBox } from '@mui/icons-material'
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridRenderCellParams,
  GridRowId,
  GridRowModes,
  GridRowModesModel,
} from '@mui/x-data-grid'
import { formatDate, toSlugVariant, toTitle } from '@/lib/utils'
import { navLinksData } from '@/lib/nav-links'
import { Evolution, OutfitCategory, OutfitSet, OutfitVariantRaw } from '@/lib/types/outfit'
import LazyAvatar from '@/components/eureka/lazy-avatar'
import { updateOutfitVariant } from '@/app/dashboard/actions'

type Row = OutfitVariantRaw

interface OutfitVariantTableProps {
  rows: Row[]
  outfitSets: OutfitSet[]
  outfitCategories: OutfitCategory[]
  evolutions: Evolution[]
}

const LOCKED_FIELDS = ['slug', 'image_url', 'updated_at']

function LockedCell({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <Tooltip title="Edit on full form">
      <IconButton href={href} size="small" sx={{ borderRadius: 1, px: 0.5, opacity: 0.5 }}>
        {children}
      </IconButton>
    </Tooltip>
  )
}

export function OutfitVariantTable({
  rows: initialRows,
  outfitSets,
  outfitCategories,
  evolutions,
}: OutfitVariantTableProps) {
  const [rows, setRows] = useState<Row[]>(initialRows)
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({})

  const editHref = (row: Row) =>
    `${navLinksData.dashboard.outfits.variants.edit}/${row.slug ?? toSlugVariant(row.outfit_set ?? '', row.outfit_category ?? '', row.evolution ?? '')}`

  const isEditing = (id: GridRowId) => rowModesModel[id]?.mode === GridRowModes.Edit

  const handleEditClick = useCallback(
    (id: GridRowId) => () => setRowModesModel((m) => ({ ...m, [id]: { mode: GridRowModes.Edit } })),
    []
  )

  const handleSaveClick = useCallback(
    (id: GridRowId) => () => setRowModesModel((m) => ({ ...m, [id]: { mode: GridRowModes.View } })),
    []
  )

  const handleCancelClick = useCallback(
    (id: GridRowId) => () =>
      setRowModesModel((m) => ({
        ...m,
        [id]: { mode: GridRowModes.View, ignoreModifications: true },
      })),
    []
  )

  const processRowUpdate = useCallback(async (newRow: Row, oldRow: Row) => {
    try {
      await updateOutfitVariant(newRow.id, {
        outfit_set: newRow.outfit_set,
        outfit_category: newRow.outfit_category,
        evolution: newRow.evolution,
        default: newRow.default,
      })
      setRows((prev) => prev.map((r) => (r.id === newRow.id ? newRow : r)))
      return newRow
    } catch {
      return oldRow
    }
  }, [])

  const columns: GridColDef<Row>[] = [
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 96,
      getActions: ({ id, row }) =>
        isEditing(id)
          ? [
              <GridActionsCellItem
                key="save"
                icon={<SaveIcon color="primary" />}
                label="Save"
                title="Save"
                onClick={handleSaveClick(id)}
              />,
              <GridActionsCellItem
                key="cancel"
                icon={<CancelIcon />}
                label="Cancel"
                title="Cancel"
                onClick={handleCancelClick(id)}
              />,
            ]
          : [
              <GridActionsCellItem
                key="edit"
                icon={<EditIcon color="secondary" />}
                label="Edit row"
                title="Edit row"
                onClick={handleEditClick(id)}
              />,
              <GridActionsCellItem
                key="open"
                icon={<OpenInNewIcon color="secondary" />}
                label="View page"
                title="View page"
                onClick={() => (window.location.href = `/outfits/${row.outfit_set}`)}
              />,
            ],
    },
    {
      field: 'image_url',
      headerName: 'Image',
      width: 64,
      sortable: false,
      renderCell: ({ row }: GridRenderCellParams<Row>) => (
        <Stack justifyContent="center" sx={{ flex: 1, height: 52 }}>
          {isEditing(row.id) ? (
            <LockedCell href={editHref(row)}>
              <LazyAvatar
                alt={row.outfit_set || 'Image'}
                color="transparent"
                size="sm"
                src={row.image_url ?? ''}
                sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
              >
                <Category fontSize="inherit" />
              </LazyAvatar>
            </LockedCell>
          ) : (
            <LazyAvatar
              alt={row.outfit_set || 'Image'}
              color="transparent"
              size="sm"
              src={row.image_url ?? ''}
              sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
            >
              <Category fontSize="inherit" />
            </LazyAvatar>
          )}
        </Stack>
      ),
    },
    {
      field: 'outfit_set',
      headerName: 'Outfit Set',
      width: 200,
      editable: true,
      type: 'singleSelect',
      valueOptions: outfitSets.map((s) => ({ value: s.slug, label: s.title })),
      valueGetter: (_value: unknown, row: Row) => row.outfit_set ?? '',
      renderCell: ({ row }: GridRenderCellParams<Row>) => (
        <span style={{ fontWeight: 500 }}>{row.outfit_sets?.title ?? '—'}</span>
      ),
    },
    {
      field: 'slug',
      headerName: 'Slug',
      width: 240,
      renderCell: ({ row, value }: GridRenderCellParams<Row>) =>
        isEditing(row.id) ? (
          <LockedCell href={editHref(row)}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{value}</span>
          </LockedCell>
        ) : (
          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{value}</span>
        ),
    },
    {
      field: 'outfit_category',
      headerName: 'Category',
      width: 140,
      editable: true,
      type: 'singleSelect',
      valueOptions: outfitCategories.map((c) => ({ value: c.slug, label: toTitle(c.title ?? '') })),
      valueGetter: (_value: unknown, row: Row) => row.outfit_category ?? '',
      valueFormatter: (value: string | null) =>
        outfitCategories.find((c) => c.slug === value)?.title ?? toTitle(value || '—'),
    },
    {
      field: 'evolution',
      headerName: 'Evolution',
      width: 140,
      editable: true,
      type: 'singleSelect',
      valueOptions: evolutions.map((e) => ({ value: e.slug, label: toTitle(e.title ?? '') })),
      valueGetter: (_value: unknown, row: Row) => row.evolution ?? '',
      valueFormatter: (value: string | null) =>
        evolutions.find((e) => e.slug === value)?.title ?? toTitle(value || '—'),
    },
    {
      field: 'default',
      headerName: 'Default',
      width: 100,
      editable: true,
      type: 'boolean',
      renderCell: ({ value }: GridRenderCellParams<Row>) =>
        value ? <CheckBox color="secondary" fontSize="small" /> : null,
    },
    {
      field: 'updated_at',
      headerName: 'Updated',
      width: 120,
      valueFormatter: (value: string | null) => (value ? formatDate(value) : '—'),
    },
  ]

  return (
    <DataGrid
      disableRowSelectionOnClick
      columns={columns}
      editMode="row"
      getRowId={(row) => row.id}
      initialState={{ pagination: { paginationModel: { pageSize: 15 } } }}
      isCellEditable={({ field }) => !LOCKED_FIELDS.includes(field)}
      pageSizeOptions={[6, 8, 15, 20, 30, 50, 100]}
      processRowUpdate={processRowUpdate}
      rowModesModel={rowModesModel}
      rows={rows}
      sx={{ border: 0 }}
      onRowModesModelChange={setRowModesModel}
    />
  )
}
```

- [ ] **Step 2: Create `app/dashboard/outfit-variant-list.tsx`**

```typescript
'use client'

import { OutfitVariantRaw } from '@/lib/types/outfit'
import { AdminList } from './admin-list'
import ListRow from './list-row'
import { toTitle } from '@/lib/utils'
import { navLinksData } from '@/lib/nav-links'

interface OutfitVariantListProps {
  rows: OutfitVariantRaw[]
  page?: number
  rowsPerPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
}

export default function OutfitVariantList({
  rows,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: OutfitVariantListProps) {
  return (
    <AdminList
      addHref={navLinksData.dashboard.outfits.variants.add}
      getKey={(variant) => variant.id}
      page={page}
      renderRow={(row) => (
        <ListRow
          image_url={row.image_url ?? undefined}
          list="outfits/variants"
          slug={row.slug ?? undefined}
          subheader={
            [toTitle(row.outfit_category!), toTitle(row.evolution!)].filter(Boolean).join(' • ') ||
            undefined
          }
          title={toTitle(row.outfit_set!) ?? '—'}
          updated_at={row.updated_at}
        />
      )}
      rows={rows}
      rowsPerPage={rowsPerPage}
      title="Outfit Variant"
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  )
}
```

- [ ] **Step 3: Type-check**

```bash
yarn tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/outfit-variant-table.tsx app/dashboard/outfit-variant-list.tsx
git commit -m "feat: add OutfitVariantTable and OutfitVariantList dashboard components"
```

---

## Task 6: Dashboard outfit pages (sets and variants)

**Files:**
- Create: `app/dashboard/outfits/sets/page.tsx`
- Create: `app/dashboard/outfits/sets/outfit-set-view.tsx`
- Create: `app/dashboard/outfits/variants/page.tsx`
- Create: `app/dashboard/outfits/variants/outfit-variant-view.tsx`

- [ ] **Step 1: Create `app/dashboard/outfits/sets/page.tsx`**

```typescript
import { getOutfitSets } from '@/hooks/data/outfit-sets'
import { getLabels } from '@/hooks/data/labels'
import { getStyles } from '@/hooks/data/styles'
import { getAbilities } from '@/hooks/data/abilities'
import { Suspense } from 'react'
import OutfitSetView from './outfit-set-view'

export default function OutfitSetsDashboard() {
  return (
    <Suspense>
      <DashboardView />
    </Suspense>
  )
}

async function DashboardView() {
  const [outfitSets, styles, labels, abilities] = await Promise.all([
    getOutfitSets(),
    getStyles(),
    getLabels(),
    getAbilities(),
  ])

  return (
    <OutfitSetView
      abilities={abilities}
      labels={labels}
      outfitSets={outfitSets}
      styles={styles}
    />
  )
}
```

- [ ] **Step 2: Create `app/dashboard/outfits/sets/outfit-set-view.tsx`**

```typescript
'use client'

import { useDashboardView } from '../../dashboard-view-context'
import { Ability, OutfitSet } from '@/lib/types/outfit'
import { Label, Style } from '@/lib/types/eureka'
import { OutfitSetTable } from '../../outfit-set-table'
import OutfitSetList from '../../outfit-set-list'
import TableContainer from '../../table-container'

export default function OutfitSetView({
  outfitSets,
  styles,
  labels,
  abilities,
}: {
  outfitSets: OutfitSet[]
  styles: Style[]
  labels: Label[]
  abilities: Ability[]
}) {
  const { view } = useDashboardView()

  return view === 'table' ? (
    <TableContainer>
      <OutfitSetTable
        abilities={abilities}
        labels={labels}
        rows={outfitSets}
        styles={styles}
      />
    </TableContainer>
  ) : (
    <OutfitSetList rows={outfitSets} />
  )
}
```

- [ ] **Step 3: Create `app/dashboard/outfits/variants/page.tsx`**

```typescript
import { getOutfitSets } from '@/hooks/data/outfit-sets'
import { getOutfitVariantsRaw } from '@/hooks/data/admin/outfit-variants'
import { getOutfitCategories } from '@/hooks/data/outfit-categories'
import { getEvolutions } from '@/hooks/data/evolutions'
import { Suspense } from 'react'
import OutfitVariantView from './outfit-variant-view'

export default function OutfitVariantsDashboard() {
  return (
    <Suspense>
      <DashboardView />
    </Suspense>
  )
}

async function DashboardView() {
  const [outfitVariants, outfitSets, outfitCategories, evolutions] = await Promise.all([
    getOutfitVariantsRaw(),
    getOutfitSets(),
    getOutfitCategories(),
    getEvolutions(),
  ])

  return (
    <OutfitVariantView
      evolutions={evolutions}
      outfitCategories={outfitCategories}
      outfitSets={outfitSets}
      outfitVariants={outfitVariants}
    />
  )
}
```

- [ ] **Step 4: Create `app/dashboard/outfits/variants/outfit-variant-view.tsx`**

```typescript
'use client'

import { useDashboardView } from '../../dashboard-view-context'
import { Evolution, OutfitCategory, OutfitSet, OutfitVariantRaw } from '@/lib/types/outfit'
import { OutfitVariantTable } from '../../outfit-variant-table'
import OutfitVariantList from '../../outfit-variant-list'
import TableContainer from '../../table-container'

export default function OutfitVariantView({
  outfitVariants,
  outfitSets,
  outfitCategories,
  evolutions,
}: {
  outfitVariants: OutfitVariantRaw[]
  outfitSets: OutfitSet[]
  outfitCategories: OutfitCategory[]
  evolutions: Evolution[]
}) {
  const { view } = useDashboardView()

  return view === 'table' ? (
    <TableContainer>
      <OutfitVariantTable
        evolutions={evolutions}
        outfitCategories={outfitCategories}
        outfitSets={outfitSets}
        rows={outfitVariants}
      />
    </TableContainer>
  ) : (
    <OutfitVariantList rows={outfitVariants} />
  )
}
```

- [ ] **Step 5: Type-check**

```bash
yarn tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add app/dashboard/outfits/
git commit -m "feat: add outfit sets and variants dashboard pages"
```

---

## Task 7: Outfit set server actions

**Files:**
- Create: `app/(admin)/outfits/sets/actions.ts`

- [ ] **Step 1: Create `app/(admin)/outfits/sets/actions.ts`**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { toSlugVariant } from '@/lib/utils'
import { navLinksData } from '@/lib/nav-links'

export async function addOutfitSet(_: unknown, formData: FormData) {
  const supabase = await createClient()

  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const slug = (formData.get('slug') as string | null)?.trim() ?? ''
  const description = (formData.get('description') as string | null)?.trim() || null
  const rarityRaw = formData.get('rarity') as string | null
  const rarity = rarityRaw ? parseInt(rarityRaw, 10) : null
  const style = (formData.get('style') as string | null) || null
  const label = (formData.get('label') as string | null) || null
  const ability = (formData.get('ability') as string | null) || null
  const evolutionSelect = JSON.parse(
    (formData.get('evolution_select') as string) || '[]'
  ) as string[]
  const defaultEvolution = (formData.get('default_evolution') as string | null) || ''
  const outfitCategories = JSON.parse(
    (formData.get('outfit_categories') as string) || '[]'
  ) as { slug: string }[]

  const { error } = await supabase
    .from('outfit_sets')
    .insert([{ title, slug, description, rarity, style, label, ability }])

  if (error) return { error: error.message }

  const rollback = async () => {
    await supabase.from('outfit_sets').delete().eq('slug', slug)
  }

  if (evolutionSelect.length > 0 && outfitCategories.length > 0) {
    const variants = evolutionSelect.flatMap((evolution) =>
      outfitCategories.map((cat) => ({
        outfit_set: slug,
        outfit_category: cat.slug,
        evolution,
        slug: toSlugVariant(slug, cat.slug, evolution),
        default: defaultEvolution ? evolution === defaultEvolution : false,
      }))
    )
    const { error: variantError } = await supabase.from('outfit_variants').insert(variants)
    if (variantError) {
      await rollback()
      return { error: 'Failed to save variants. The set was not created — please try again.' }
    }
  }

  redirect(navLinksData.dashboard.outfits.sets.add.replace('/new', ''))
}

export async function editOutfitSet(
  id: number,
  initialEvolutions: string[],
  backUrl: string,
  _: unknown,
  formData: FormData
) {
  const supabase = await createClient()

  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const slug = (formData.get('slug') as string | null)?.trim() ?? ''
  const description = (formData.get('description') as string | null)?.trim() || null
  const rarityRaw = formData.get('rarity') as string | null
  const rarity = rarityRaw ? parseInt(rarityRaw, 10) : null
  const style = (formData.get('style') as string | null) || null
  const label = (formData.get('label') as string | null) || null
  const ability = (formData.get('ability') as string | null) || null
  const evolutionSelect = JSON.parse(
    (formData.get('evolution_select') as string) || '[]'
  ) as string[]
  const defaultEvolution = (formData.get('default_evolution') as string | null) || ''
  const outfitCategories = JSON.parse(
    (formData.get('outfit_categories') as string) || '[]'
  ) as { slug: string }[]

  const { error } = await supabase
    .from('outfit_sets')
    .update({ title, slug, description, rarity, style, label, ability, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  const addedEvolutions = evolutionSelect.filter((e) => !initialEvolutions.includes(e))
  const removedEvolutions = initialEvolutions.filter((e) => !evolutionSelect.includes(e))

  if (addedEvolutions.length > 0) {
    const newVariants = addedEvolutions.flatMap((evolution) =>
      outfitCategories.map((cat) => ({
        outfit_set: slug,
        outfit_category: cat.slug,
        evolution,
        slug: toSlugVariant(slug, cat.slug, evolution),
        default: defaultEvolution ? evolution === defaultEvolution : false,
      }))
    )
    const { error: insertError } = await supabase.from('outfit_variants').insert(newVariants)
    if (insertError) return { error: insertError.message }
  }

  if (removedEvolutions.length > 0) {
    const { error: deleteError } = await supabase
      .from('outfit_variants')
      .delete()
      .eq('outfit_set', slug)
      .in('evolution', removedEvolutions)
    if (deleteError) return { error: deleteError.message }
  }

  // Sync default flag
  const { error: clearDefaultError } = await supabase
    .from('outfit_variants')
    .update({ default: false })
    .eq('outfit_set', slug)
  if (clearDefaultError) return { error: clearDefaultError.message }

  if (defaultEvolution) {
    const { error: setDefaultError } = await supabase
      .from('outfit_variants')
      .update({ default: true })
      .eq('outfit_set', slug)
      .eq('evolution', defaultEvolution)
    if (setDefaultError) return { error: setDefaultError.message }
  }

  // Update variant images passed as hidden inputs
  const variantImageEntries = [...formData.entries()].filter(([key]) =>
    key.startsWith('variant_image_')
  )
  for (const [key, value] of variantImageEntries) {
    const variantSlug = key.replace('variant_image_', '')
    await supabase
      .from('outfit_variants')
      .update({ image_url: (value as string) || null })
      .eq('slug', variantSlug)
  }

  redirect(backUrl)
}
```

- [ ] **Step 2: Type-check**

```bash
yarn tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add 'app/(admin)/outfits/sets/actions.ts'
git commit -m "feat: add addOutfitSet and editOutfitSet server actions"
```

---

## Task 8: Add outfit set form and page

**Files:**
- Create: `app/(admin)/outfits/sets/new/page.tsx`
- Create: `app/(admin)/outfits/sets/new/add-outfit-set-form.tsx`

- [ ] **Step 1: Create `app/(admin)/outfits/sets/new/page.tsx`**

```typescript
import { Suspense } from 'react'
import AddOutfitSetForm from './add-outfit-set-form'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import { getAbilities } from '@/hooks/data/abilities'
import { getEvolutions } from '@/hooks/data/evolutions'
import { getOutfitCategories } from '@/hooks/data/outfit-categories'
import { Stack } from '@mui/material'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Add Outfit Set',
}

export default function NewOutfitSetPage() {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <NewOutfitSet />
      </Stack>
    </Suspense>
  )
}

async function NewOutfitSet() {
  const [styles, labels, abilities, evolutions, outfitCategories] = await Promise.all([
    getStyles(),
    getLabels(),
    getAbilities(),
    getEvolutions(),
    getOutfitCategories(),
  ])

  return (
    <AddOutfitSetForm
      abilities={abilities}
      evolutions={evolutions}
      labels={labels}
      outfitCategories={outfitCategories}
      styles={styles}
    />
  )
}
```

- [ ] **Step 2: Create `app/(admin)/outfits/sets/new/add-outfit-set-form.tsx`**

```typescript
'use client'

import { useActionState, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
} from '@mui/material'
import { toSlug } from '@/lib/utils'
import { Edit, EditOff } from '@mui/icons-material'
import { Ability, Evolution, OutfitCategory } from '@/lib/types/outfit'
import { Label, Style } from '@/lib/types/eureka'
import { SparkleIcon } from '@/components/rarity-stars'
import { useFormConfig } from '@/app/(admin)/form-context'
import { addOutfitSet } from '../actions'
import { navLinksData } from '@/lib/nav-links'

const FORM_ID = 'add-outfit-set'

export default function AddOutfitSetForm({
  styles,
  labels,
  abilities,
  evolutions,
  outfitCategories,
}: {
  styles: Style[]
  labels: Label[]
  abilities: Ability[]
  evolutions: Evolution[]
  outfitCategories: OutfitCategory[]
}) {
  const { setFormConfig } = useFormConfig()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [rarity, setRarity] = useState<number | ''>('')
  const [style, setStyle] = useState('')
  const [label, setLabel] = useState('')
  const [ability, setAbility] = useState('')
  const [description, setDescription] = useState('')
  const [evolutionSelect, setEvolutionSelect] = useState<string[]>([])
  const [defaultEvolution, setDefaultEvolution] = useState('')
  const [editSlug, setEditSlug] = useState(false)

  const maxEvolutionsByRarity: Record<number, number> = { 5: 5, 4: 3, 3: 1, 2: 0 }
  const maxEvolutions = typeof rarity === 'number' ? (maxEvolutionsByRarity[rarity] ?? 5) : 5

  useEffect(() => {
    setEvolutionSelect((prev) => (prev.length > maxEvolutions ? prev.slice(0, maxEvolutions) : prev))
  }, [maxEvolutions])

  useEffect(() => {
    if (defaultEvolution && !evolutionSelect.includes(defaultEvolution)) setDefaultEvolution('')
  }, [evolutionSelect, defaultEvolution])

  const handleEvolutionChange = (event: SelectChangeEvent<typeof evolutionSelect>) => {
    const { target: { value } } = event
    setEvolutionSelect(typeof value === 'string' ? value.split(',') : value)
  }

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!editSlug) setSlug(toSlug(value))
  }

  const [state, action, pending] = useActionState(addOutfitSet, null)

  useEffect(() => {
    setFormConfig({
      formId: FORM_ID,
      backUrl: navLinksData.dashboard.outfits.sets.add.replace('/new', ''),
      pending,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending])

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
          helperText="Auto-generated from name — edit if needed"
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

        <TextField
          multiline
          label="Description"
          minRows={3}
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <FormControl>
          <InputLabel>Rarity</InputLabel>
          <Select
            label="Rarity"
            name="rarity"
            value={rarity}
            onChange={(e) => setRarity(e.target.value as number | '')}
          >
            <MenuItem value="">—</MenuItem>
            {[2, 3, 4, 5].map((n) => (
              <MenuItem key={n} value={n}>
                {n}
                <SparkleIcon
                  color="inherit"
                  fontSize="inherit"
                  sx={{ rotate: '15deg', ml: 0.5, mt: -0.3 }}
                />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Style</InputLabel>
          <Select
            label="Style"
            name="style"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {styles.map((s) => (
              <MenuItem key={s.slug} value={s.slug}>
                {s.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Label</InputLabel>
          <Select
            label="Label"
            name="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {labels.map((l) => (
              <MenuItem key={l.slug} value={l.slug}>
                {l.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Ability</InputLabel>
          <Select
            label="Ability"
            name="ability"
            value={ability}
            onChange={(e) => setAbility(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {abilities.map((a) => (
              <MenuItem key={a.slug} value={a.slug}>
                {a.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ m: 1, minWidth: 300 }}>
          <InputLabel>Evolutions</InputLabel>
          <Select
            multiple
            input={<OutlinedInput label="Evolutions" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((slug) => {
                  const evo = evolutions.find((e) => e.slug === slug)
                  return <Chip key={slug} label={evo?.title ?? slug} size="small" />
                })}
              </Box>
            )}
            value={evolutionSelect}
            onChange={handleEvolutionChange}
          >
            {evolutions.map((e) => (
              <MenuItem
                key={e.slug}
                disabled={evolutionSelect.length >= maxEvolutions && !evolutionSelect.includes(e.slug)}
                value={e.slug}
              >
                {e.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl disabled={evolutionSelect.length === 0}>
          <InputLabel>Default Evolution</InputLabel>
          <Select
            input={<OutlinedInput label="Default Evolution" />}
            value={defaultEvolution}
            onChange={(e) => setDefaultEvolution(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {evolutionSelect.map((slug) => {
              const evo = evolutions.find((e) => e.slug === slug)
              return (
                <MenuItem key={slug} value={slug}>
                  {evo?.title ?? slug}
                </MenuItem>
              )
            })}
          </Select>
        </FormControl>

        <Alert severity="info">
          Images can be added after saving — use the outfit set edit form, or edit each variant
          individually via its outfit variant form.
        </Alert>

        <input name="evolution_select" type="hidden" value={JSON.stringify(evolutionSelect)} />
        <input name="default_evolution" type="hidden" value={defaultEvolution} />
        <input name="outfit_categories" type="hidden" value={JSON.stringify(outfitCategories)} />
      </Stack>
    </form>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
yarn tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add 'app/(admin)/outfits/sets/new/'
git commit -m "feat: add outfit set add form and page"
```

---

## Task 9: Edit outfit set form and page

**Files:**
- Create: `app/(admin)/outfits/sets/edit/[slug]/page.tsx`
- Create: `app/(admin)/outfits/sets/edit/[slug]/edit-outfit-set-form.tsx`

- [ ] **Step 1: Create `app/(admin)/outfits/sets/edit/[slug]/page.tsx`**

```typescript
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import EditOutfitSetForm from './edit-outfit-set-form'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import { getAbilities } from '@/hooks/data/abilities'
import { getEvolutions } from '@/hooks/data/evolutions'
import { getOutfitCategories } from '@/hooks/data/outfit-categories'
import { Stack } from '@mui/material'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Outfit Set',
}

export default async function EditOutfitSetPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditOutfitSet params={params} />
      </Stack>
    </Suspense>
  )
}

async function EditOutfitSet({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const referer = (await headers()).get('referer') ?? ''
  const refererPath = new URL(referer, 'http://localhost').pathname
  const back = refererPath.startsWith('/outfits/') ? refererPath : '/dashboard/outfits/sets'

  const supabase = await createClient()

  const { data: outfitSet } = await supabase
    .from('outfit_sets')
    .select('id, slug, title, description, rarity, style, label, ability, updated_at')
    .eq('slug', slug)
    .single()

  if (!outfitSet || !outfitSet.slug) notFound()

  const [styles, labels, abilities, evolutions, outfitCategories] = await Promise.all([
    getStyles(),
    getLabels(),
    getAbilities(),
    getEvolutions(),
    getOutfitCategories(),
  ])

  const { data: variantRows, error: variantRowsError } = await supabase
    .from('outfit_variants')
    .select('id, outfit_set, evolution, outfit_category, slug, image_url, default, updated_at')
    .eq('outfit_set', outfitSet.slug)
  if (variantRowsError) throw variantRowsError

  const initialEvolutions = [...new Set(variantRows.map((v) => v.evolution as string).filter(Boolean))]
  const initialDefaultEvolution = variantRows.find((v) => v.default)?.evolution ?? ''
  const initialVariants = variantRows

  return (
    <EditOutfitSetForm
      abilities={abilities}
      back={back}
      evolutions={evolutions}
      initialDefaultEvolution={initialDefaultEvolution}
      initialEvolutions={initialEvolutions}
      initialVariants={initialVariants}
      labels={labels}
      outfitCategories={outfitCategories}
      outfitSet={outfitSet}
      styles={styles}
    />
  )
}
```

- [ ] **Step 2: Create `app/(admin)/outfits/sets/edit/[slug]/edit-outfit-set-form.tsx`**

```typescript
'use client'

import { useActionState, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { toSlug } from '@/lib/utils'
import { CheckBox, CheckBoxOutlineBlank, Edit, EditOff } from '@mui/icons-material'
import { Ability, Evolution, OutfitCategory, OutfitSetRaw } from '@/lib/types/outfit'
import { Tables } from '@/lib/types/supabase'
import { Label, Style } from '@/lib/types/eureka'
import { SparkleIcon } from '@/components/rarity-stars'
import ImageUpload from '@/components/forms/image-upload'
import { useFormConfig } from '@/app/(admin)/form-context'
import { editOutfitSet } from '../../actions'

type OutfitVariantRow = Pick<
  Tables<'outfit_variants'>,
  'id' | 'slug' | 'outfit_set' | 'evolution' | 'outfit_category' | 'image_url' | 'default' | 'updated_at'
>

const FORM_ID = 'edit-outfit-set'

export default function EditOutfitSetForm({
  outfitSet,
  styles,
  labels,
  abilities,
  evolutions,
  outfitCategories,
  initialEvolutions,
  initialDefaultEvolution = '',
  initialVariants = [],
  back,
}: {
  outfitSet: OutfitSetRaw
  styles: Style[]
  labels: Label[]
  abilities: Ability[]
  evolutions: Evolution[]
  outfitCategories: OutfitCategory[]
  initialEvolutions: string[]
  initialDefaultEvolution?: string
  initialVariants?: OutfitVariantRow[]
  back: string
}) {
  const { setFormConfig } = useFormConfig()
  const [title, setTitle] = useState(outfitSet.title)
  const [slug, setSlug] = useState(outfitSet.slug ?? toSlug(outfitSet.title))
  const [rarity, setRarity] = useState<number | ''>(outfitSet.rarity ?? '')
  const [description, setDescription] = useState(outfitSet.description ?? '')
  const [style, setStyle] = useState(outfitSet.style ?? '')
  const [label, setLabel] = useState(outfitSet.label ?? '')
  const [ability, setAbility] = useState(outfitSet.ability ?? '')
  const [editSlug, setEditSlug] = useState(false)
  const [evolutionSelect, setEvolutionSelect] = useState<string[]>(initialEvolutions)
  const [defaultEvolution, setDefaultEvolution] = useState(initialDefaultEvolution)
  const [variantImages, setVariantImages] = useState<Record<string, string | null>>(
    Object.fromEntries(initialVariants.filter((v) => v.slug).map((v) => [v.slug, v.image_url]))
  )

  const maxEvolutionsByRarity: Record<number, number> = { 5: 5, 4: 3, 3: 1, 2: 0 }
  const maxEvolutions = typeof rarity === 'number' ? (maxEvolutionsByRarity[rarity] ?? 5) : 5

  useEffect(() => {
    setEvolutionSelect((prev) => (prev.length > maxEvolutions ? prev.slice(0, maxEvolutions) : prev))
  }, [maxEvolutions])

  useEffect(() => {
    if (defaultEvolution && !evolutionSelect.includes(defaultEvolution)) setDefaultEvolution('')
  }, [evolutionSelect, defaultEvolution])

  const handleEvolutionChange = (event: SelectChangeEvent<typeof evolutionSelect>) => {
    const { target: { value } } = event
    setEvolutionSelect(typeof value === 'string' ? value.split(',') : value)
  }

  const boundAction = editOutfitSet.bind(null, outfitSet.id, initialEvolutions, back)
  const [state, action, pending] = useActionState(boundAction, null)

  useEffect(() => {
    setFormConfig({ formId: FORM_ID, backUrl: back, pending })
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
          helperText="Used in the URL — edit with caution"
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

        <TextField
          multiline
          label="Description"
          minRows={3}
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <FormControl>
          <InputLabel>Rarity</InputLabel>
          <Select
            label="Rarity"
            name="rarity"
            value={rarity}
            onChange={(e) => setRarity(e.target.value as number | '')}
          >
            <MenuItem value="">—</MenuItem>
            {[2, 3, 4, 5].map((n) => (
              <MenuItem key={n} value={n}>
                {n}
                <SparkleIcon
                  color="inherit"
                  fontSize="inherit"
                  sx={{ rotate: '15deg', ml: 0.5, mt: -0.3 }}
                />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Style</InputLabel>
          <Select label="Style" name="style" value={style} onChange={(e) => setStyle(e.target.value)}>
            <MenuItem value="">—</MenuItem>
            {styles.map((s) => (
              <MenuItem key={s.slug} value={s.slug}>{s.title}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Label</InputLabel>
          <Select label="Label" name="label" value={label} onChange={(e) => setLabel(e.target.value)}>
            <MenuItem value="">—</MenuItem>
            {labels.map((l) => (
              <MenuItem key={l.slug} value={l.slug}>{l.title}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Ability</InputLabel>
          <Select label="Ability" name="ability" value={ability} onChange={(e) => setAbility(e.target.value)}>
            <MenuItem value="">—</MenuItem>
            {abilities.map((a) => (
              <MenuItem key={a.slug} value={a.slug}>{a.title}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ m: 1, minWidth: 300 }}>
          <InputLabel>Evolutions</InputLabel>
          <Select
            multiple
            input={<OutlinedInput label="Evolutions" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((slug) => {
                  const evo = evolutions.find((e) => e.slug === slug)
                  return <Chip key={slug} label={evo?.title ?? slug} size="small" />
                })}
              </Box>
            )}
            value={evolutionSelect}
            onChange={handleEvolutionChange}
          >
            {evolutions.map((e) => {
              const selected = evolutionSelect.includes(e.slug)
              const SelectionIcon = selected ? CheckBox : CheckBoxOutlineBlank
              return (
                <MenuItem
                  key={e.slug}
                  disabled={evolutionSelect.length >= maxEvolutions && !selected}
                  value={e.slug}
                >
                  <SelectionIcon fontSize="small" style={{ marginRight: 8, padding: 9, boxSizing: 'content-box' }} />
                  {e.title}
                </MenuItem>
              )
            })}
          </Select>
        </FormControl>

        <FormControl disabled={evolutionSelect.length === 0}>
          <InputLabel>Default Evolution</InputLabel>
          <Select
            input={<OutlinedInput label="Default Evolution" />}
            value={defaultEvolution}
            onChange={(e) => setDefaultEvolution(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {evolutionSelect.map((slug) => {
              const evo = evolutions.find((e) => e.slug === slug)
              return (
                <MenuItem key={slug} value={slug}>
                  {evo?.title ?? slug}
                </MenuItem>
              )
            })}
          </Select>
        </FormControl>

        {initialVariants.length > 0 && (
          <Stack spacing={1}>
            <Typography variant="subtitle2">Variant Images</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              {initialVariants
                .filter((v) => v.slug)
                .map((v) => (
                  <Stack key={v.slug} spacing={0.5}>
                    <Typography sx={{ fontFamily: 'monospace' }} variant="caption">
                      {v.slug}
                    </Typography>
                    <input
                      name={`variant_image_${v.slug}`}
                      type="hidden"
                      value={variantImages[v.slug!] ?? ''}
                    />
                    <ImageUpload
                      slug={v.slug ?? undefined}
                      table="outfit_variants"
                      url={variantImages[v.slug!] ?? null}
                      onUpload={(url) =>
                        setVariantImages((prev) => ({ ...prev, [v.slug!]: url }))
                      }
                    />
                  </Stack>
                ))}
            </Box>
          </Stack>
        )}

        <Button size="small" sx={{ mt: 1 }} onClick={() => window.history.back()}>
          Cancel
        </Button>

        <input name="evolution_select" type="hidden" value={JSON.stringify(evolutionSelect)} />
        <input name="default_evolution" type="hidden" value={defaultEvolution} />
        <input name="outfit_categories" type="hidden" value={JSON.stringify(outfitCategories)} />
      </Stack>
    </form>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
yarn tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add 'app/(admin)/outfits/sets/edit/'
git commit -m "feat: add outfit set edit form and page"
```

---

## Task 10: Outfit variant server actions

**Files:**
- Create: `app/(admin)/outfits/variants/actions.ts`

- [ ] **Step 1: Create `app/(admin)/outfits/variants/actions.ts`**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { toSlugVariant } from '@/lib/utils'
import { navLinksData } from '@/lib/nav-links'

export async function addOutfitVariant(_: unknown, formData: FormData) {
  const supabase = await createClient()

  const outfit_set = (formData.get('outfit_set') as string | null) || null
  const outfit_category = (formData.get('outfit_category') as string | null) || null
  const evolution = (formData.get('evolution') as string | null) || null
  const image_url = (formData.get('image_url') as string | null) || null
  const isDefault = formData.get('default') === 'true'
  const slug =
    (formData.get('slug') as string | null)?.trim() ||
    toSlugVariant(outfit_set ?? '', outfit_category ?? '', evolution ?? '')

  const { error } = await supabase
    .from('outfit_variants')
    .insert([{ outfit_set, outfit_category, evolution, image_url, default: isDefault, slug }])

  if (error) return { error: error.message }

  redirect(navLinksData.dashboard.outfits.variants.add.replace('/new', ''))
}

export async function editOutfitVariant(
  id: number,
  backUrl: string,
  _: unknown,
  formData: FormData
) {
  const supabase = await createClient()

  const outfit_set = (formData.get('outfit_set') as string | null) || null
  const outfit_category = (formData.get('outfit_category') as string | null) || null
  const evolution = (formData.get('evolution') as string | null) || null
  const image_url = (formData.get('image_url') as string | null) || null
  const isDefault = formData.get('default') === 'true'
  const slug =
    (formData.get('slug') as string | null)?.trim() ||
    toSlugVariant(outfit_set ?? '', outfit_category ?? '', evolution ?? '')

  const { error } = await supabase
    .from('outfit_variants')
    .update({
      outfit_set,
      outfit_category,
      evolution,
      image_url,
      default: isDefault,
      slug,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  redirect(backUrl)
}
```

- [ ] **Step 2: Type-check**

```bash
yarn tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add 'app/(admin)/outfits/variants/actions.ts'
git commit -m "feat: add addOutfitVariant and editOutfitVariant server actions"
```

---

## Task 11: Add outfit variant form and page

**Files:**
- Create: `app/(admin)/outfits/variants/new/page.tsx`
- Create: `app/(admin)/outfits/variants/new/add-outfit-variant-form.tsx`

- [ ] **Step 1: Create `app/(admin)/outfits/variants/new/page.tsx`**

```typescript
import { Suspense } from 'react'
import AddOutfitVariantForm from './add-outfit-variant-form'
import { getOutfitSetsRaw } from '@/hooks/data/admin/outfit-sets'
import { getOutfitVariantsRaw } from '@/hooks/data/admin/outfit-variants'
import { getOutfitCategories } from '@/hooks/data/outfit-categories'
import { getEvolutions } from '@/hooks/data/evolutions'
import { Stack } from '@mui/material'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Add Outfit Variant',
}

export default function NewOutfitVariantPage() {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <NewOutfitVariant />
      </Stack>
    </Suspense>
  )
}

async function NewOutfitVariant() {
  const [outfitSets, outfitVariants, outfitCategories, evolutions] = await Promise.all([
    getOutfitSetsRaw(),
    getOutfitVariantsRaw(),
    getOutfitCategories(),
    getEvolutions(),
  ])

  return (
    <AddOutfitVariantForm
      evolutions={evolutions}
      outfitCategories={outfitCategories}
      outfitSets={outfitSets ?? []}
      variants={outfitVariants ?? []}
    />
  )
}
```

- [ ] **Step 2: Create `app/(admin)/outfits/variants/new/add-outfit-variant-form.tsx`**

```typescript
'use client'

import { useActionState, useEffect, useState } from 'react'
import {
  Alert,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  ListSubheader,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import { toSlugVariant } from '@/lib/utils'
import { Edit, EditOff } from '@mui/icons-material'
import ImageUpload from '@/components/forms/image-upload'
import { Evolution, OutfitCategory, OutfitSetRaw, OutfitVariantRaw } from '@/lib/types/outfit'
import { useFormConfig } from '@/app/(admin)/form-context'
import { addOutfitVariant } from '../actions'
import { navLinksData } from '@/lib/nav-links'

const FORM_ID = 'add-outfit-variant'

export default function AddOutfitVariantForm({
  outfitSets,
  outfitCategories,
  evolutions,
  variants,
}: {
  outfitSets: OutfitSetRaw[]
  outfitCategories: OutfitCategory[]
  evolutions: Evolution[]
  variants: OutfitVariantRaw[]
}) {
  const { setFormConfig } = useFormConfig()
  const [outfitSet, setOutfitSet] = useState('')
  const [outfitCategory, setOutfitCategory] = useState('')
  const [evolution, setEvolution] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isDefault, setIsDefault] = useState(false)
  const [slug, setSlug] = useState('')
  const [editSlug, setEditSlug] = useState(false)

  const hasDefault = variants.some(
    (v) => v.outfit_set === outfitSet && v.outfit_category === outfitCategory && v.default
  )

  useEffect(() => {
    if (!editSlug && outfitSet && outfitCategory && evolution) {
      setSlug(toSlugVariant(outfitSet, outfitCategory, evolution))
    }
  }, [outfitSet, outfitCategory, evolution, editSlug])

  const [state, action, pending] = useActionState(addOutfitVariant, null)

  useEffect(() => {
    setFormConfig({
      formId: FORM_ID,
      backUrl: navLinksData.dashboard.outfits.variants.add.replace('/new', ''),
      pending,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending])

  // Group categories by type
  const groupedCategories = outfitCategories.reduce<Record<string, OutfitCategory[]>>(
    (groups, cat) => {
      const type = cat.type ?? 'Other'
      ;(groups[type] ??= []).push(cat)
      return groups
    },
    {}
  )

  return (
    <form action={action} id={FORM_ID}>
      <Stack spacing={2} sx={{ maxWidth: 'sm' }}>
        {state?.error && <Alert severity="error">{state.error}</Alert>}

        <FormControl required>
          <InputLabel>Outfit Set</InputLabel>
          <Select
            label="Outfit Set"
            name="outfit_set"
            value={outfitSet}
            onChange={(e) => setOutfitSet(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {outfitSets.map((set) => (
              <MenuItem key={set.id} value={set.slug ?? ''}>
                {set.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Category</InputLabel>
          <Select
            label="Category"
            name="outfit_category"
            value={outfitCategory}
            onChange={(e) => setOutfitCategory(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {Object.entries(groupedCategories).flatMap(([type, cats]) => [
              <ListSubheader key={type}>{type}</ListSubheader>,
              ...cats.map((c) => (
                <MenuItem key={c.slug} value={c.slug}>
                  {c.part}
                </MenuItem>
              )),
            ])}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Evolution</InputLabel>
          <Select
            label="Evolution"
            name="evolution"
            value={evolution}
            onChange={(e) => setEvolution(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {evolutions.map((e) => (
              <MenuItem key={e.slug} value={e.slug}>
                {e.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <input name="slug" type="hidden" value={slug} />
        <TextField
          required
          disabled={!editSlug}
          helperText="Auto-generated from set, category, and evolution — edit if needed"
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

        <input name="image_url" type="hidden" value={imageUrl ?? ''} />
        <ImageUpload
          slug={slug || undefined}
          table="outfit_variants"
          url={imageUrl}
          onUpload={(url) => setImageUrl(url)}
        />

        <input name="default" type="hidden" value={String(isDefault)} />
        <FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={isDefault}
                disabled={hasDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
            }
            label="Default variant"
          />
          <FormHelperText>
            {hasDefault
              ? 'This category already has a default variant for this set'
              : 'Used to determine the outfit set thumbnail image — limit one per category'}
          </FormHelperText>
        </FormControl>
      </Stack>
    </form>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
yarn tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add 'app/(admin)/outfits/variants/new/'
git commit -m "feat: add outfit variant add form and page"
```

---

## Task 12: Edit outfit variant form and page

**Files:**
- Create: `app/(admin)/outfits/variants/edit/[slug]/page.tsx`
- Create: `app/(admin)/outfits/variants/edit/[slug]/edit-outfit-variant-form.tsx`

- [ ] **Step 1: Create `app/(admin)/outfits/variants/edit/[slug]/page.tsx`**

```typescript
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import EditOutfitVariantForm from './edit-outfit-variant-form'
import { getOutfitSetsRaw } from '@/hooks/data/admin/outfit-sets'
import { getOutfitVariantsRaw } from '@/hooks/data/admin/outfit-variants'
import { getOutfitCategories } from '@/hooks/data/outfit-categories'
import { getEvolutions } from '@/hooks/data/evolutions'
import { Stack } from '@mui/material'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Outfit Variant',
}

export default async function EditOutfitVariantPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditOutfitVariant params={params} />
      </Stack>
    </Suspense>
  )
}

async function EditOutfitVariant({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: variant } = await supabase
    .from('outfit_variants')
    .select(
      'id, outfit_set, outfit_category, evolution, image_url, default, slug, updated_at, outfit_sets ( title ), outfit_categories ( title ), evolutions ( title )'
    )
    .eq('slug', slug)
    .single()

  if (!variant) notFound()

  const [outfitSets, outfitVariants, outfitCategories, evolutions] = await Promise.all([
    getOutfitSetsRaw(),
    getOutfitVariantsRaw(),
    getOutfitCategories(),
    getEvolutions(),
  ])

  return (
    <EditOutfitVariantForm
      back="/dashboard/outfits/variants"
      evolutions={evolutions}
      outfitCategories={outfitCategories}
      outfitSets={outfitSets ?? []}
      variant={variant}
      variants={outfitVariants ?? []}
    />
  )
}
```

- [ ] **Step 2: Create `app/(admin)/outfits/variants/edit/[slug]/edit-outfit-variant-form.tsx`**

```typescript
'use client'

import { useActionState, useEffect, useState } from 'react'
import {
  Alert,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  ListSubheader,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import { toSlugVariant } from '@/lib/utils'
import { Edit, EditOff } from '@mui/icons-material'
import ImageUpload from '@/components/forms/image-upload'
import { Evolution, OutfitCategory, OutfitSetRaw, OutfitVariantRaw } from '@/lib/types/outfit'
import { useFormConfig } from '@/app/(admin)/form-context'
import { editOutfitVariant } from '../../actions'

const FORM_ID = 'edit-outfit-variant'

export default function EditOutfitVariantForm({
  variant,
  outfitSets,
  outfitCategories,
  evolutions,
  variants,
  back,
}: {
  variant: OutfitVariantRaw
  outfitSets: OutfitSetRaw[]
  outfitCategories: OutfitCategory[]
  evolutions: Evolution[]
  variants: OutfitVariantRaw[]
  back: string
}) {
  const { setFormConfig } = useFormConfig()
  const [outfitSet, setOutfitSet] = useState(variant.outfit_set ?? '')
  const [outfitCategory, setOutfitCategory] = useState(variant.outfit_category ?? '')
  const [evolution, setEvolution] = useState(variant.evolution ?? '')
  const [imageUrl, setImageUrl] = useState<string | null>(variant.image_url)
  const [isDefault, setIsDefault] = useState(variant.default)
  const [slug, setSlug] = useState(
    variant.slug ??
      toSlugVariant(variant.outfit_set ?? '', variant.outfit_category ?? '', variant.evolution ?? '')
  )
  const [editSlug, setEditSlug] = useState(false)

  const hasDefault = variants.some(
    (v) =>
      v.id !== variant.id &&
      v.outfit_set === outfitSet &&
      v.outfit_category === outfitCategory &&
      v.default
  )

  useEffect(() => {
    if (!editSlug && outfitSet && outfitCategory && evolution) {
      setSlug(toSlugVariant(outfitSet, outfitCategory, evolution))
    }
  }, [outfitSet, outfitCategory, evolution, editSlug])

  const boundAction = editOutfitVariant.bind(null, variant.id, back)
  const [state, action, pending] = useActionState(boundAction, null)

  useEffect(() => {
    setFormConfig({ formId: FORM_ID, backUrl: back, pending })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, back])

  const groupedCategories = outfitCategories.reduce<Record<string, OutfitCategory[]>>(
    (groups, cat) => {
      const type = cat.type ?? 'Other'
      ;(groups[type] ??= []).push(cat)
      return groups
    },
    {}
  )

  return (
    <form action={action} id={FORM_ID}>
      <Stack spacing={2} sx={{ maxWidth: 'sm' }}>
        {state?.error && <Alert severity="error">{state.error}</Alert>}

        <FormControl required>
          <InputLabel>Outfit Set</InputLabel>
          <Select
            label="Outfit Set"
            name="outfit_set"
            value={outfitSet}
            onChange={(e) => setOutfitSet(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {outfitSets.map((set) => (
              <MenuItem key={set.id} value={set.slug ?? ''}>
                {set.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Category</InputLabel>
          <Select
            label="Category"
            name="outfit_category"
            value={outfitCategory}
            onChange={(e) => setOutfitCategory(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {Object.entries(groupedCategories).flatMap(([type, cats]) => [
              <ListSubheader key={type}>{type}</ListSubheader>,
              ...cats.map((c) => (
                <MenuItem key={c.slug} value={c.slug}>
                  {c.part}
                </MenuItem>
              )),
            ])}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Evolution</InputLabel>
          <Select
            label="Evolution"
            name="evolution"
            value={evolution}
            onChange={(e) => setEvolution(e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {evolutions.map((e) => (
              <MenuItem key={e.slug} value={e.slug}>
                {e.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <input name="slug" type="hidden" value={slug} />
        <TextField
          required
          disabled={!editSlug}
          helperText="Auto-generated from set, category, and evolution — edit if needed"
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

        <input name="image_url" type="hidden" value={imageUrl ?? ''} />
        <ImageUpload
          slug={slug || undefined}
          table="outfit_variants"
          url={imageUrl}
          onUpload={(url) => setImageUrl(url)}
        />

        <input name="default" type="hidden" value={String(isDefault)} />
        <FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={isDefault}
                disabled={hasDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
            }
            label="Default variant"
          />
          <FormHelperText>
            {hasDefault
              ? 'This category already has a default variant for this set'
              : 'Used to determine the outfit set thumbnail image — limit one per category'}
          </FormHelperText>
        </FormControl>
      </Stack>
    </form>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
yarn tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add 'app/(admin)/outfits/variants/edit/'
git commit -m "feat: add outfit variant edit form and page"
```

---

## Verification

After all tasks complete:

1. **Type-check clean:**
   ```bash
   yarn tsc --noEmit
   ```
   Expected: No errors.

2. **Add outfit set:** Navigate to `/outfits/sets/new` as admin. Fill all fields, pick 1+ evolutions, set a default evolution. Submit. Confirm a row appears in `outfit_sets` and `outfit_variants` rows are created in Supabase Studio.

3. **Edit outfit set:** Navigate to `/outfits/sets/edit/[slug]`. Change fields, add/remove an evolution, upload a variant image. Submit. Confirm changes persisted and variants were added/removed.

4. **Add outfit variant:** Navigate to `/outfits/variants/new`. Confirm category selector shows Piece / Accessory subheaders. Confirm slug auto-generates. Submit. Confirm row in `outfit_variants`.

5. **Edit outfit variant:** Navigate to `/outfits/variants/edit/[slug]`. Confirm form pre-populated. Change evolution and save.

6. **Dashboard stat cards:** Navigate to `/dashboard`. Confirm "Outfit Sets" and "Outfit Variants" cards appear with correct counts and Add buttons.

7. **Dashboard sets view:** Navigate to `/dashboard/outfits/sets`. Confirm DataGrid renders. Inline-edit a title and save. Confirm `updateOutfitSet` is called and table updates.

8. **Dashboard variants view:** Navigate to `/dashboard/outfits/variants`. Confirm DataGrid renders. Inline-edit evolution. Confirm `updateOutfitVariant` is called.

9. **Nav sub-items:** Open dashboard nav. Confirm "Outfit Sets" and "Outfit Variants" appear as sub-items under Dashboard for admin users.
