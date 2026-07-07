'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { useSidebar } from '@/components/navbar/navbar-toolbar-context'

// Renders its children into the root SidebarShell's portal target. Registers
// presence so the shell knows a body exists (hasBody). Rendered by a page UNDER
// its own data providers, so the body's hooks (useEurekaData, etc.) still work.
export default function SidebarBody({ children }: { children: React.ReactNode }) {
  const { portalTarget, registerBody, unregisterBody } = useSidebar()

  React.useEffect(() => {
    registerBody()
    return unregisterBody
  }, [registerBody, unregisterBody])

  if (!portalTarget) return null
  return createPortal(children, portalTarget)
}
