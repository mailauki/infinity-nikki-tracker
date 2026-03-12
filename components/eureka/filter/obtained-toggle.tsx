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
      exclusive
      aria-label="Filter"
      disabled={disabled}
      value={selectedFilter}
      onChange={onFilterChange}
    >
      {['Missing', 'Obtained'].map((filter) => (
        <ToggleButton key={filter} sx={{ py: 1.75 }} value={filter}>
          {filter}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}
