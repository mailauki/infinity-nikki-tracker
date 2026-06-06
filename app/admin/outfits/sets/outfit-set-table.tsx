'use client'

import { useCallback, useState } from 'react'
import { Box, Chip, IconButton, Stack, Tooltip } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
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
import RarityStars from '@/components/rarity-stars'
import ImageUpload from '@/components/forms/image-upload'
import { updateOutfitSet } from '@/app/admin/actions'

type Row = OutfitSet

interface OutfitSetTableProps {
  rows: Row[]
  styles: Style[]
  labels: Label[]
  abilities: Ability[]
}

const LOCKED_FIELDS = ['slug', 'evolutions', 'glowup_evolution', 'updated_at']

function LockedCell({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <Tooltip title="Edit on full form">
      <IconButton href={href} size="small" sx={{ borderRadius: 1, px: 0.5, opacity: 0.5 }}>
        {children}
      </IconButton>
    </Tooltip>
  )
}

export function OutfitSetTable({
  rows: initialRows,
  styles,
  labels,
  abilities,
}: OutfitSetTableProps) {
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
        rarity: newRow.rarity ?? undefined,
        style: newRow.style,
        label: newRow.label,
        label_2: newRow.label_2,
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
            table="outfit_sets"
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
            table="outfit_sets"
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
          <Stack sx={{ flex: 1, height: 52, justifyContent: 'center', color: 'text.secondary' }}>
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
      field: 'label_2',
      headerName: 'Label 2',
      width: 120,
      editable: true,
      type: 'singleSelect',
      valueOptions: [
        { value: '', label: '—' },
        ...labels.map((l) => ({ value: l.slug, label: toTitle(l.title ?? '') })),
      ],
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
      renderCell: ({ row }: GridRenderCellParams<Row>) => {
        const content = (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', py: 0.5 }}>
            {row.evolutions?.length
              ? row.evolutions.map((e: Evolution) => (
                  <Chip key={e.slug} label={e.subtitle} size="small" />
                ))
              : '—'}
          </Box>
        )
        return (
          <Stack sx={{ flex: 1, height: 52, justifyContent: 'center' }}>
            {isEditing(row.id) ? <LockedCell href={editHref(row)}>{content}</LockedCell> : content}
          </Stack>
        )
      },
    },
    {
      field: 'glowup_evolution',
      headerName: 'Glow-Up',
      width: 160,
      sortable: false,
      renderCell: ({ row, value }: GridRenderCellParams<Row>) => {
        const evo = row.evolutions?.find((e: Evolution) => e.slug === value)
        const content = <span>{evo ? evo.subtitle : '—'}</span>
        return isEditing(row.id) ? <LockedCell href={editHref(row)}>{content}</LockedCell> : content
      },
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
      rowHeight={100}
      rowModesModel={rowModesModel}
      rows={rows}
      sx={{ border: 0, bgcolor: 'transparent' }}
      onRowModesModelChange={setRowModesModel}
    />
  )
}
