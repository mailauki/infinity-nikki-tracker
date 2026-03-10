'use client'

import { ToggleFilter } from '@/lib/types/props'
import { ToggleButton, ToggleButtonGroup } from '@mui/material'

export default function ObtainedToggle({
  selectedFilter,
  onFilterChange,
  disabled,
}: {
  selectedFilter: ToggleFilter | null
  onFilterChange: (event: React.MouseEvent<HTMLElement>, newFilter: ToggleFilter | null) => void
  disabled?: boolean
}) {
  return (
    <ToggleButtonGroup
      value={selectedFilter}
      onChange={onFilterChange}
      exclusive
      aria-label="Filter"
      disabled={disabled}
    >
      {['Missing', 'Obtained'].map((filter) => (
        <ToggleButton key={filter} value={filter} sx={{ py: 1.75 }}>
          {filter}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}
