'use client'

import { useCallback, useState } from 'react'
import { IconButton, Tooltip } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import {
  GridActionsCellItem,
  GridColDef,
  GridRowId,
  GridRowModes,
  GridRowModesModel,
} from '@mui/x-data-grid'

export function LockedCell({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <Tooltip title="Edit on full form">
      <IconButton href={href} size="small" sx={{ borderRadius: 1, px: 0.5, opacity: 0.5 }}>
        {children}
      </IconButton>
    </Tooltip>
  )
}

export function useRowActions() {
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({})

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

  return {
    rowModesModel,
    setRowModesModel,
    isEditing,
    handleEditClick,
    handleSaveClick,
    handleCancelClick,
  }
}

export function actionsColumn<Row extends { id: string | number }>({
  isEditing,
  handleEditClick,
  handleSaveClick,
  handleCancelClick,
  onViewClick,
  viewLabel = 'View form',
}: {
  isEditing: (id: GridRowId) => boolean
  handleEditClick: (id: GridRowId) => () => void
  handleSaveClick: (id: GridRowId) => () => void
  handleCancelClick: (id: GridRowId) => () => void
  onViewClick: (row: Row) => void
  viewLabel?: string
}): GridColDef<Row> {
  return {
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
              label={viewLabel}
              title={viewLabel}
              onClick={() => onViewClick(row)}
            />,
          ],
  }
}

export const DATA_GRID_DEFAULTS = {
  disableRowSelectionOnClick: true,
  editMode: 'row' as const,
  initialState: { pagination: { paginationModel: { pageSize: 15 } } },
  pageSizeOptions: [6, 8, 15, 20, 30, 50, 100],
}
