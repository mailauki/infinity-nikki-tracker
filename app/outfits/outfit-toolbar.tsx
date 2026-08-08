'use client'

import ToolbarSlot from '@/components/navbar/toolbar-slot'
import FilterMenu from '@/components/filter/filter-menu'
import { SortButton } from '@/components/navbar/appbar-actions'
import ImageModeButton from '@/components/navbar/image-mode-button'

export default function OutfitToolBar({ showFilters = true }: { showFilters?: boolean }) {
  return (
    <ToolbarSlot>
      <ImageModeButton />
      <SortButton />
      {showFilters && <FilterMenu />}
    </ToolbarSlot>
  )
}
