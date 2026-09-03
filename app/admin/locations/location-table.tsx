'use client'

import EditIcon from '@mui/icons-material/Edit'
import { DataGrid, GridActionsCellItem, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { navLinksData } from '@/lib/nav-links'
import { LocationRaw } from '@/hooks/data/admin/locations'
import { TABLE_ROW_HEIGHT } from '@/lib/types/props'

type Row = LocationRaw

interface LocationTableProps {
  rows: Row[]
}

export function LocationTable({ rows }: LocationTableProps) {
  const editHref = (row: Row) => `${navLinksData.admin.locations.locations.edit}/${row.slug}`

  const columns: GridColDef<Row>[] = [
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
      field: 'id',
      headerName: 'ID',
      type: 'number',
      width: TABLE_ROW_HEIGHT,
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
      flex: 1,
      minWidth: 200,
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
      rowHeight={TABLE_ROW_HEIGHT}
      rows={rows}
      sx={{ border: 0, bgcolor: 'transparent' }}
    />
  )
}
