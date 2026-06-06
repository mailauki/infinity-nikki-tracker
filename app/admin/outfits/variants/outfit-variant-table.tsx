'use client'

import { useCallback, useState } from 'react'
import { IconButton, Stack, Tooltip } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { CheckBox } from '@mui/icons-material'
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
import ImageUpload from '@/components/forms/image-upload'
import { updateOutfitVariant } from '@/app/admin/actions'

type Row = OutfitVariantRaw

interface OutfitVariantTableProps {
  rows: Row[]
  outfitSets: OutfitSet[]
  outfitCategories: OutfitCategory[]
  evolutions: Evolution[]
}

const LOCKED_FIELDS = ['slug', 'updated_at']

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
        outfit_set: newRow.outfit_set ?? undefined,
        outfit_category: newRow.outfit_category,
        evolution: newRow.evolution,
        default: newRow.default ?? undefined,
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
                label="View form"
                title="View form"
                onClick={() => (window.location.href = editHref(row))}
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
            slug={row.slug ?? undefined}
            table="outfit_variants"
            url={row.image_url ?? null}
            onUpload={(url) =>
              setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, image_url: url } : r)))
            }
          />
        </Stack>
      ),
    },
    {
      field: 'alt_image_url',
      headerName: 'Alt Image',
      width: 100,
      sortable: false,
      renderCell: ({ row }: GridRenderCellParams<Row>) => (
        <Stack sx={{ flex: 1, height: 100, justifyContent: 'center' }}>
          <ImageUpload
            column="alt_image_url"
            slug={row.slug ?? undefined}
            table="outfit_variants"
            url={row.alt_image_url ?? null}
            onUpload={(url) =>
              setRows((prev) =>
                prev.map((r) => (r.id === row.id ? { ...r, alt_image_url: url } : r))
              )
            }
          />
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
      valueOptions: evolutions.map((e) => ({
        value: e.slug,
        label: e.subtitle ?? toTitle(e.title ?? ''),
      })),
      valueGetter: (_value: unknown, row: Row) => row.evolution ?? '',
      valueFormatter: (value: string | null) =>
        evolutions.find((e) => e.slug === value)?.subtitle ?? toTitle(value || '—'),
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
      rowHeight={100}
      rowModesModel={rowModesModel}
      rows={rows}
      sx={{ border: 0 }}
      onRowModesModelChange={setRowModesModel}
    />
  )
}
