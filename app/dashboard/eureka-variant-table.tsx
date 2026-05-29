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
import { Category as CategoryType, Color, EurekaSet, EurekaVariantRaw } from '@/lib/types/eureka'
import LazyAvatar from '@/components/eureka/lazy-avatar'
import { updateEurekaVariant } from '@/app/dashboard/actions'

type Row = EurekaVariantRaw

interface EurekaVariantTableProps {
  rows: Row[]
  eurekaSets: EurekaSet[]
  categories: CategoryType[]
  colors: Color[]
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

export function EurekaVariantTable({
  rows: initialRows,
  eurekaSets,
  categories,
  colors,
}: EurekaVariantTableProps) {
  const [rows, setRows] = useState<Row[]>(initialRows)
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({})

  const editHref = (row: Row) =>
    `/eureka-variant/edit/${row.slug ?? toSlugVariant(row.eureka_set ?? '', row.category ?? '', row.color ?? '')}`

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
      await updateEurekaVariant(newRow.id, {
        eureka_set: newRow.eureka_set,
        category: newRow.category,
        color: newRow.color,
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
                onClick={() => (window.location.href = `/eureka/${row.eureka_set}`)}
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
                alt={row.eureka_set || 'Image'}
                color="transparent"
                size="sm"
                src={row.image_url!}
                sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
              >
                <Category fontSize="inherit" />
              </LazyAvatar>
            </LockedCell>
          ) : (
            <LazyAvatar
              alt={row.eureka_set || 'Image'}
              color="transparent"
              size="sm"
              src={row.image_url!}
              sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
            >
              <Category fontSize="inherit" />
            </LazyAvatar>
          )}
        </Stack>
      ),
    },
    {
      field: 'eureka_set',
      headerName: 'Eureka Set',
      width: 200,
      editable: true,
      type: 'singleSelect',
      valueOptions: eurekaSets.map((s) => ({ value: s.slug, label: s.title })),
      valueGetter: (_value: unknown, row: Row) => row.eureka_set ?? '',
      renderCell: ({ row }: GridRenderCellParams<Row>) => (
        <span style={{ fontWeight: 500 }}>{row.eureka_sets?.title ?? '—'}</span>
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
      field: 'category',
      headerName: 'Category',
      width: 120,
      editable: true,
      type: 'singleSelect',
      valueOptions: categories.map((c) => ({ value: c.slug, label: toTitle(c.title ?? '') })),
      valueGetter: (_value: unknown, row: Row) => row.category ?? '',
      valueFormatter: (value: string | null) =>
        categories.find((c) => c.slug === value)?.title ?? toTitle(value || '—'),
    },
    {
      field: 'color',
      headerName: 'Color',
      width: 120,
      editable: true,
      type: 'singleSelect',
      valueOptions: colors.map((c) => ({ value: c.slug, label: toTitle(c.title ?? '') })),
      valueGetter: (_value: unknown, row: Row) => row.color ?? '',
      valueFormatter: (value: string | null) =>
        colors.find((c) => c.slug === value)?.title ?? toTitle(value || '—'),
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
