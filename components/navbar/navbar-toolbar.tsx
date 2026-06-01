'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { useNavBarToolbar } from './navbar-toolbar-context'

export default function NavBarToolbar({ children }: { children: React.ReactNode }) {
  const { toolbarSlot } = useNavBarToolbar()

  if (!toolbarSlot) return null
  return createPortal(children, toolbarSlot)
}
