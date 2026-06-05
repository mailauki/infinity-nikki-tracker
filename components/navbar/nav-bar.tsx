'use client'

import * as React from 'react'
import { AppBar, Toolbar } from '@mui/material'
import PageTitle from './page-title'
import { useNavBarToolbar, useNavDrawer } from './navbar-toolbar-context'

export default function NavBar() {
  const { setToolbarSlot } = useNavBarToolbar()
  const { drawerOpen } = useNavDrawer()
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
      position='fixed'
      sx={{
        borderColor: 'transparent',
        backdropFilter: 'blur(8px)',
        maskImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 1) 80%, rgba(0, 0, 0, 0) 100%)',
        ml: { xs: 0, sm: drawerOpen ? '260px' : 'calc(var(--mui-spacing) * 10 + 21px)' },
        width: { xs: '100%', sm: drawerOpen ? 'calc(100% - 260px)' : 'calc(100% - (var(--mui-spacing) * 10 + 21px))' },
        transition: (theme) => theme.transitions.create(['margin-left', 'width'], {
          easing: theme.transitions.easing.sharp,
          duration: drawerOpen
            ? theme.transitions.duration.enteringScreen
            : theme.transitions.duration.leavingScreen,
        }),
      }}
      variant="outlined"
    >
      <Toolbar sx={{ alignItems: 'flex-end', justifyContent: 'center', pb: 0.15 }}>
        <PageTitle />
      </Toolbar>
      <Toolbar ref={refCallback} sx={{ mb: 2 }} />
    </AppBar>
  )
}
