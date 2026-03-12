import { AppBar, Stack, Toolbar } from '@mui/material'
import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <AppBar elevation={0} position="absolute">
        <Toolbar>
          <Stack alignItems="center" direction="row" justifyContent="center" sx={{ flex: 1 }}>
            <Link href="/" style={{ cursor: 'pointer' }}>
              <Image
                alt="Infinity Nikki Logo"
                height={40}
                src="/infinity-nikki-logo.png"
                width={90}
              />
            </Link>
          </Stack>
        </Toolbar>
      </AppBar>
      {children}
    </>
  )
}
