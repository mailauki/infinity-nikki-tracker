'use client'

import ToolbarSlot from '@/components/toolbar-slot'
import { SortButton } from '@/components/navbar/appbar-actions'

export default function TrialsToolBar() {
  return (
    <ToolbarSlot>
      <SortButton />
    </ToolbarSlot>
  )
}
