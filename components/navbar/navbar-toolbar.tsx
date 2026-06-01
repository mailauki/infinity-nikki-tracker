'use client'

import * as React from 'react'
import { useNavBarToolbar } from './navbar-toolbar-context'

export default function NavBarToolbar({ children }: { children: React.ReactNode }) {
  const { setToolbarContent } = useNavBarToolbar()

  React.useEffect(() => {
    setToolbarContent(children)
    return () => setToolbarContent(null)
  }, [children, setToolbarContent])

  return null
}
