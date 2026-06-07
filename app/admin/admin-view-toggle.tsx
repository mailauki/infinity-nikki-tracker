'use client'

import { updateAdminView } from '@/app/actions/preferences'
import { useAdminView } from './admin-view-context'
import { CalendarViewMonth, ViewList } from '@mui/icons-material'
import { ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material'

export default function AdminViewToggle() {
  const { view, setView } = useAdminView()

  async function handleViewChange(_: unknown, value: 'list' | 'table' | null) {
    if (!value) return
    setView(value)
    await updateAdminView(value)
  }

  return (
    <ToggleButtonGroup
      exclusive
      sx={{ height: 'fit-content' }}
      value={view}
      onChange={handleViewChange}
    >
      <Tooltip title="List view">
        <ToggleButton aria-label="list" size="small" value="list">
          <ViewList fontSize="small" />
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Table view">
        <ToggleButton aria-label="table" size="small" value="table">
          <CalendarViewMonth fontSize="small" />
        </ToggleButton>
      </Tooltip>
    </ToggleButtonGroup>
  )
}
