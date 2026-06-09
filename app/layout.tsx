import type { Metadata } from 'next'
import './globals.css'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter'
import { Noto_Sans_JP, Roboto } from 'next/font/google'
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import ThemeClientProvider from '@/components/theme-client-provider'
import { CssBaseline, Stack, Toolbar } from '@mui/material'
import { Analytics } from '@vercel/analytics/next'
import { Suspense } from 'react'
import Footer from '@/components/navbar/nav-footer'
import NavBar from '@/components/navbar/nav-bar'
import PullToRefresh from '@/components/pull-to-refresh'
import NavDrawer from '@/components/navbar/nav-drawer'
import { NavBarToolbarProvider } from '@/components/navbar/navbar-toolbar-context'
import SnackbarAlertProvider from '@/components/snackbar-provider'
import { cookies } from 'next/headers'
import { connection } from 'next/server'
import type { ColorTheme } from '@/lib/types/eureka'

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
  preload: false,
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
    icon: '/infinity-nikki-logo.png',
  },
}

const VALID_THEMES: ColorTheme[] = ['default', 'moonlight', 'cherry', 'forest']

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await connection()
  const cookieStore = await cookies()
  const raw = cookieStore.get('color_theme')?.value
  const colorTheme: ColorTheme =
    raw && (VALID_THEMES as string[]).includes(raw) ? (raw as ColorTheme) : 'default'

  return (
    <html
      suppressHydrationWarning
      className={`${roboto.variable} ${notoSansJP.variable}`}
      lang="en"
    >
      <body>
        <InitColorSchemeScript attribute="class" defaultMode="system" />
        <AppRouterCacheProvider options={{ key: 'css' }}>
          <ThemeClientProvider colorTheme={colorTheme}>
            <CssBaseline />
            <NavBarToolbarProvider>
							<SnackbarAlertProvider>
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
                  <Toolbar sx={{ mb: 2 }} />
                  <Toolbar sx={{ mb: 2 }} />
                  {/* ^ Toolbar spacers for NavBar and NavBarToolbar */}
                  <Suspense>
                    <PullToRefresh />
                  </Suspense>
                  <Stack sx={{ flex: 1, p: 2 }}>{children}</Stack>
                  <Footer />
                </Stack>
              </Stack>
              <Analytics />
							</SnackbarAlertProvider>
            </NavBarToolbarProvider>
          </ThemeClientProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
