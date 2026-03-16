'use client'

import { AppBar, Stack, Toolbar, useColorScheme } from '@mui/material'
import Link from 'next/link'
import Image from 'next/image'

export default function AuthAppBar() {
  const { mode, systemMode } = useColorScheme()
  const isDarkMode = (mode === 'system' ? systemMode : mode) === 'dark'

  return (
    <AppBar color="transparent" elevation={0} position="absolute">
      <Toolbar>
        <Stack alignItems="center" direction="row" justifyContent="center" sx={{ flex: 1 }}>
          <Link href="/" style={{ cursor: 'pointer' }}>
            <Image
              alt="Infinity Nikki Logo"
              height={40}
              src="/infinity-nikki-logo.png"
              style={{
                filter: isDarkMode ? 'none' : 'brightness(40%)',
              }}
              width={90}
            />
          </Link>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
