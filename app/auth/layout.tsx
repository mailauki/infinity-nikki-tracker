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
      <AppBar position="absolute" elevation={0}>
        <Toolbar>
          <Stack direction="row" alignItems="center" justifyContent="center" sx={{ flex: 1 }}>
            <Link href="/" style={{ cursor: 'pointer' }}>
              <Image
                src="/infinity-nikki-logo.png"
                alt="Infinity Nikki Logo"
                width={90}
                height={40}
              />
            </Link>
          </Stack>
        </Toolbar>
      </AppBar>
      {children}
    </>
  )
}
