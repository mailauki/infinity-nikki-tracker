'use client'

import { AppBar, Stack, Toolbar, useColorScheme } from '@mui/material'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'

export default function AuthAppBar() {
  const { mode, systemMode } = useColorScheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDarkMode = mounted && (mode === 'system' ? systemMode : mode) === 'dark'

  return (
    <AppBar color="transparent" elevation={0} position="absolute">
      <Toolbar>
        <Stack direction="row" sx={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
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
