import type { Metadata } from 'next'
import './globals.css'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter'
import { Noto_Sans_JP, Roboto } from 'next/font/google'
import { ThemeProvider } from '@mui/material/styles'
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import theme from '@/lib/theme'
import { CssBaseline, Stack, Toolbar } from '@mui/material'
import { Analytics } from '@vercel/analytics/next'
import { Suspense } from 'react'
import Footer from '@/components/navbar/nav-footer'
import NavBar from '@/components/navbar/nav-bar'
import PullToRefresh from '@/components/pull-to-refresh'
import NavDrawer from '@/components/navbar/nav-drawer'
import { NavBarToolbarProvider } from '@/components/navbar/navbar-toolbar-context'

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
})

const notoSansJP = Noto_Sans_JP({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-noto-sans-jp',
})

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    template: '%s | Infinity Nikki Tracker',
    default: 'Infinity Nikki Tracker',
  },
  description: 'Track your collection from your favorite cozy open-world game Infinity Nikki',
  icons: {
    icon: [
      { url: '/icon.png' },
      { url: '/icon-dark.png', media: '(prefers-color-scheme: dark)' },
    ],
    shortcut: ['/shortcut-icon.png'],
    apple: ['/apple-icon.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      suppressHydrationWarning
      className={`${roboto.variable} ${notoSansJP.variable}`}
      lang="en"
    >
      <body>
        <InitColorSchemeScript attribute="class" defaultMode="system" />
        <AppRouterCacheProvider options={{ key: 'css' }}>
          <ThemeProvider defaultMode="system" theme={theme}>
            <CssBaseline />
            <NavBarToolbarProvider>
              <Stack
                direction="row"
                sx={{
                  minHeight: '100vh',
                  backgroundColor: 'surface.containerLowest',
                  alignItems: 'flex-start',
                }}
              >
                <Suspense fallback={null}>
                  <NavDrawer />
                </Suspense>
                <Stack
                  sx={{
                    flex: 1,
                    minHeight: '100vh',
                    minWidth: '300px',
                    justifyContent: 'flex-start',
                  }}
                >
                  <Suspense>
                    <NavBar />
                  </Suspense>
                  <Toolbar />
                  <Toolbar sx={{ mb: 2 }} />
                  {/* ^ Toolbar spacers for NavBar and NavBarToolbar */}
                  <Suspense>
                    <PullToRefresh />
                  </Suspense>
                  <Stack sx={{ flex: 1, px: 2 }}>{children}</Stack>
                  <Footer />
                </Stack>
              </Stack>
              <Analytics />
            </NavBarToolbarProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
