'use client'

import { useIsDarkMode } from '@/hooks/use-is-dark-mode'
import { AppBar, Stack, Toolbar } from '@mui/material'
import Link from 'next/link'
import Image from 'next/image'

export default function AuthAppBar() {
  const isDarkMode = useIsDarkMode()

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
