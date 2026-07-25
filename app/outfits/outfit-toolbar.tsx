'use client'

import ToolbarSlot from '@/components/toolbar-slot'
import FilterMenu from '@/components/filter/filter-menu'
import { SortButton } from '@/components/navbar/appbar-actions'

export default function OutfitToolBar({ showFilters = true }: { showFilters?: boolean }) {
  return (
    <ToolbarSlot>
      <SortButton />
      {showFilters && <FilterMenu />}
    </ToolbarSlot>
  )
}
