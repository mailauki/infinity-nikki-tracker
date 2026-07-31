'use client'

import ToolbarSlot from '@/components/navbar/toolbar-slot'
import { SortButton } from '@/components/navbar/appbar-actions'

export default function TrialsToolBar() {
  return (
    <ToolbarSlot>
      <SortButton />
    </ToolbarSlot>
  )
}
