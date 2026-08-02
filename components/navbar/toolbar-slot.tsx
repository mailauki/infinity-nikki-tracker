'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { useToolbar } from '@/components/navbar/navbar-toolbar-context'

// Renders its children into the root LayoutShell's AppBar second-row target.
// Registers presence so the shell knows a toolbar exists (hasToolbar → true rows).
// Rendered by a page UNDER its own data providers, so the toolbar's hooks
// (useOutfitImageMode, useSeasonFilter, useSidebar, etc.) still work while the DOM
// lands in the shell AppBar. Mirrors components/sidebar/sidebar-body.tsx.
//
// The row has two sections: `children` land in the trailing action area
// (right-aligned, sized to content — icon buttons, menus), and the optional
// `lead` lands in the leading area, which spans the remaining width for wide
// content like tabs. Pages that only need actions pass children alone.
export default function ToolbarSlot({
  children,
  lead,
}: {
  children?: React.ReactNode
  lead?: React.ReactNode
}) {
  const { toolbarTarget, toolbarLeadTarget, registerToolbar, unregisterToolbar } = useToolbar()

  React.useEffect(() => {
    registerToolbar()
    return unregisterToolbar
  }, [registerToolbar, unregisterToolbar])

  return (
    <>
      {lead && toolbarLeadTarget ? createPortal(lead, toolbarLeadTarget) : null}
      {children && toolbarTarget ? createPortal(children, toolbarTarget) : null}
    </>
  )
}
