'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { useToolbar } from '@/components/navbar/navbar-toolbar-context'

// Renders its children into the root LayoutShell's AppBar second-row target.
// Registers presence so the shell knows a toolbar exists (hasToolbar → true rows).
// Rendered by a page UNDER its own data providers, so the toolbar's hooks
// (useOutfitImageMode, useSeasonFilter, useSidebar, etc.) still work while the DOM
// lands in the shell AppBar. Mirrors components/sidebar/sidebar-body.tsx.
export default function ToolbarSlot({ children }: { children: React.ReactNode }) {
  const { toolbarTarget, registerToolbar, unregisterToolbar } = useToolbar()

  React.useEffect(() => {
    registerToolbar()
    return unregisterToolbar
  }, [registerToolbar, unregisterToolbar])

  if (!toolbarTarget) return null
  return createPortal(children, toolbarTarget)
}
