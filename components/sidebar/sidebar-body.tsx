'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { useSidebar } from '@/components/navbar/navbar-toolbar-context'

// Renders its children into the root LayoutShell's sidebar portal target. Registers
// presence so the shell knows a body exists (hasBody). Rendered by a page UNDER
// its own data providers, so the body's hooks (useEurekaData, etc.) still work.
//
// `panelId` is only needed when a page mounts more than one SidebarBody (e.g. the
// season page's contents + filter panels) and wants them mutually exclusive —
// pass it and the body only portals its children while `activePanel` matches.
// Every other page mounts exactly one body and omits panelId, so it renders
// unconditionally, same as before this prop existed.
export default function SidebarBody({
  children,
  panelId,
}: {
  children: React.ReactNode
  panelId?: string
}) {
  const { portalTarget, registerBody, unregisterBody, activePanel } = useSidebar()

  React.useEffect(() => {
    registerBody()
    return unregisterBody
  }, [registerBody, unregisterBody])

  if (!portalTarget) return null
  if (panelId && activePanel !== panelId) return null
  return createPortal(children, portalTarget)
}
