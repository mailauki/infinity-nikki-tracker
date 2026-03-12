'use client'

import { ObtainedFilter } from '@/lib/types/props'
import { ToggleButton, ToggleButtonGroup } from '@mui/material'

export default function ObtainedToggle({
  selectedObtainedFilter,
  onObtainedFilterChange,
  disabled,
}: {
  selectedObtainedFilter: ObtainedFilter | null
  onObtainedFilterChange: (event: React.MouseEvent<HTMLElement>, newFilter: ObtainedFilter | null) => void
  disabled?: boolean
}) {
  return (
    <ToggleButtonGroup
      exclusive
      aria-label="Filter"
      disabled={disabled}
      value={selectedObtainedFilter}
      onChange={onObtainedFilterChange}
    >
      {['Missing', 'Obtained'].map((filter) => (
        <ToggleButton key={filter} sx={{ py: 1.75 }} value={filter}>
          {filter}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}
