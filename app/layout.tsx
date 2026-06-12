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
import { connection } from 'next/server'
import type { ColorTheme } from '@/lib/types/eureka'
import { getUserID } from '@/hooks/user'
import { getPreferences } from '@/hooks/data/preferences'

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

const VALID_THEMES: ColorTheme[] = ['default', 'moonlight', 'blossom', 'forest']

async function ThemedApp({ children }: { children: React.ReactNode }) {
  await connection()

  let colorTheme: ColorTheme = 'default'
  const user_id = await getUserID()

  if (user_id) {
    const prefs = await getPreferences(user_id)
    const saved = prefs.color_theme
    if (saved && (VALID_THEMES as string[]).includes(saved)) colorTheme = saved as ColorTheme
  }

  return (
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
  )
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
          <Suspense>
            <ThemedApp>{children}</ThemedApp>
          </Suspense>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
