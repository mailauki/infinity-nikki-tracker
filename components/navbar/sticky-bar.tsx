'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { useStickyBar } from '@/components/navbar/navbar-toolbar-context'

// Renders its children into the root LayoutShell's sticky sub-toolbar target (inside
// the <main> column, pinned under the AppBar). Registers presence so the shell knows a
// sticky bar exists (hasStickyBar). Rendered by a page UNDER its own data providers, so
// its content's hooks (useEurekaData, useOutfitData, etc.) still work while the DOM
// lands in the shell. Mirrors components/toolbar-slot.tsx and sidebar/sidebar-body.tsx.
export default function StickyBar({ children }: { children: React.ReactNode }) {
  const { stickyBarTarget, registerStickyBar, unregisterStickyBar } = useStickyBar()

  React.useEffect(() => {
    registerStickyBar()
    return unregisterStickyBar
  }, [registerStickyBar, unregisterStickyBar])

  if (!stickyBarTarget) return null
  return createPortal(children, stickyBarTarget)
}
