'use client'

import * as React from 'react'
import { AppBar, Toolbar } from '@mui/material'
import PageTitle from './page-title'
import { useNavBarToolbar } from './navbar-toolbar-context'

export default function NavBar() {
  const { toolbarContent } = useNavBarToolbar()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const content = mounted ? toolbarContent : null

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
      <Toolbar sx={{ justifyContent: 'center', pr: 4, pt: 3, pb: content ? 0 : 3 }}>
        <PageTitle />
      </Toolbar>
      {content && <Toolbar>{content}</Toolbar>}
    </AppBar>
  )
}
