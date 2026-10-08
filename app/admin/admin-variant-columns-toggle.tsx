'use client'

import { usePathname } from 'next/navigation'
import { ViewColumn, ViewWeek } from '@mui/icons-material'
import { ToggleButton, Tooltip } from '@mui/material'
import { useAdminView } from './admin-view-context'

// Toggles the per-category variant image columns in the outfit set and evolution
// admin tables. Only shown on those two pages and only in table view (the
// columns don't exist elsewhere). Session-only state from AdminViewContext.
export default function AdminVariantColumnsToggle() {
  const pathname = usePathname()
  const { view, showVariantColumns, setShowVariantColumns } = useAdminView()

  const hasVariantColumns =
    pathname === '/admin/outfits/sets' || pathname === '/admin/outfits/evolutions'

  if (view !== 'table' || !hasVariantColumns) return null

  return (
    <Tooltip title={showVariantColumns ? 'Hide piece images' : 'Show piece images'}>
      <ToggleButton
        aria-label="toggle piece image columns"
        selected={showVariantColumns}
        size="small"
        sx={{ height: 'fit-content' }}
        value="variant-columns"
        onChange={() => setShowVariantColumns(!showVariantColumns)}
      >
        {showVariantColumns ? <ViewColumn fontSize="small" /> : <ViewWeek fontSize="small" />}
      </ToggleButton>
    </Tooltip>
  )
}
