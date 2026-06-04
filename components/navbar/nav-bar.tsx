'use client'

import * as React from 'react'
import { AppBar, Toolbar } from '@mui/material'
import PageTitle from './page-title'
import { useNavBarToolbar } from './navbar-toolbar-context'

export default function NavBar() {
  const { setToolbarSlot } = useNavBarToolbar()
  const [hasContent, setHasContent] = React.useState(false)
  const slotRef = React.useRef<HTMLDivElement | null>(null)

  const refCallback = React.useCallback(
    (el: HTMLDivElement | null) => {
      slotRef.current = el
      setToolbarSlot(el)
    },
    [setToolbarSlot]
  )

  // Track whether the slot has any children so we can adjust padding
  React.useEffect(() => {
    const el = slotRef.current
    if (!el) return
    const observer = new MutationObserver(() => setHasContent(el.childElementCount > 0))
    observer.observe(el, { childList: true })
    return () => observer.disconnect()
  }, [])

  return (
    <AppBar
      color="transparent"
      position="sticky"
      sx={{
        borderColor: 'transparent',
        backdropFilter: 'blur(8px)',
        maskImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 1) 80%, rgba(0, 0, 0, 0) 100%)',
      }}
      variant="outlined"
    >
      <Toolbar sx={{ justifyContent: 'center', pr: 4, pt: 3, pb: hasContent ? 0 : 3 }}>
        <PageTitle />
      </Toolbar>
      <Toolbar ref={refCallback} sx={{ display: hasContent ? undefined : 'none', mb: 2 }} />
    </AppBar>
  )
}
