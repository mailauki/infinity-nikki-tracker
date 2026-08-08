'use client'

import ToolbarSlot from '@/components/navbar/toolbar-slot'

import MomoCloakFilterMenu from './momo-cloak-filter-menu'

export default function MomoCloakToolBar() {
  return (
    <ToolbarSlot>
      <MomoCloakFilterMenu />
    </ToolbarSlot>
  )
}
