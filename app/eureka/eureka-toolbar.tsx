'use client'

import ToolbarSlot from '@/components/toolbar-slot'
import FilterMenu from '@/components/filter/filter-menu'
import { SortButton } from '@/components/navbar/appbar-actions'

export default function EurekaToolBar() {
  return (
    <ToolbarSlot>
      <SortButton />
      <FilterMenu />
    </ToolbarSlot>
  )
}
