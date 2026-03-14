'use client'

import { ObtainedFilter } from '@/lib/types/props'
import { ToggleButton, ToggleButtonGroup } from '@mui/material'

export default function ObtainedToggle({
  selectedObtainedFilter,
  onObtainedFilterChange,
  disabled,
}: {
  selectedObtainedFilter: ObtainedFilter | null
  onObtainedFilterChange: (
    event: React.MouseEvent<HTMLElement>,
    newFilter: ObtainedFilter | null
  ) => void
  disabled?: boolean
}) {
  return (
    <ToggleButtonGroup
      exclusive
      aria-label="Obtained filter"
      disabled={disabled}
      value={selectedObtainedFilter}
      onChange={onObtainedFilterChange}
    >
      {(['missing', 'obtained'] as const).map((filter) => (
        <ToggleButton key={filter} sx={{ py: 0.75 }} value={filter}>
          {filter.charAt(0).toUpperCase() + filter.slice(1)}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}
