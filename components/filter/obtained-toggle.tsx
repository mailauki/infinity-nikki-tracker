'use client'

import { ObtainedFilter } from '@/lib/types/props'
import { ToggleButton, ToggleButtonGroup } from '@mui/material'

const LABELS: Record<ObtainedFilter, string> = {
  missing: 'Missing',
  'in-progress': 'In Progress',
  obtained: 'Obtained',
}

export default function ObtainedToggle({
  selectedObtainedFilter,
  onObtainedFilterChange,
  options = ['missing', 'obtained'],
  disabled,
}: {
  selectedObtainedFilter: ObtainedFilter | null
  onObtainedFilterChange: (
    event: React.MouseEvent<HTMLElement>,
    newFilter: ObtainedFilter | null
  ) => void
  options?: ObtainedFilter[]
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
      {options.map((filter) => (
        <ToggleButton key={filter} sx={{ py: 0.75 }} value={filter}>
          {LABELS[filter]}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}
