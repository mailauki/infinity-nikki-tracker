'use client'

import ToolbarSlot from '@/components/navbar/toolbar-slot'
import FilterMenu from '@/components/filter/filter-menu'
import { SortButton } from '@/components/navbar/appbar-actions'
import MakeupImageModeButton from '@/components/makeup/makeup-image-mode-button'

export default function MakeupToolBar({ showFilters = true }: { showFilters?: boolean }) {
  return (
    <ToolbarSlot>
      <MakeupImageModeButton />
      <SortButton />
      {showFilters && <FilterMenu />}
    </ToolbarSlot>
  )
}
