import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter'
import { Noto_Sans_JP, Roboto } from 'next/font/google'
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import ThemeClientProvider from '@/components/theme-client-provider'
import { CssBaseline, Stack } from '@mui/material'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Suspense } from 'react'
import Footer from '@/components/navbar/nav-footer'
import PullToRefresh from '@/components/pull-to-refresh'
import NavDrawer from '@/components/navbar/nav-drawer'
import SidebarShell from '@/components/sidebar/sidebar-shell'
import { DrawerStateProvider } from '@/components/navbar/navbar-toolbar-context'
import SnackbarAlertProvider from '@/components/snackbar-provider'
import { connection } from 'next/server'
import { cookies } from 'next/headers'
import type { ColorTheme } from '@/lib/types/eureka'
import { getUserID } from '@/hooks/user'
import { getPreferences } from '@/hooks/data/preferences'
import { NavUser } from '@/components/navbar/nav-user'
import PageTitle from '@/components/navbar/page-title'
import { NAV_DRAWER_STORAGE_KEY } from '@/lib/layout-constants'

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
  appleWebApp: {
    capable: true,
    title: 'Nikki Tracker',
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFF8F6' },
    { media: '(prefers-color-scheme: dark)', color: '#1a110e' },
  ],
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

  // Seed the drawer's open state from the persisted cookie so the content-pushing
  // desktop drawer renders at its final width on first paint (avoids a CLS shift).
  const cookieStore = await cookies()
  const initialDrawerOpen = cookieStore.get(NAV_DRAWER_STORAGE_KEY)?.value === 'true'

  return (
    <ThemeClientProvider colorTheme={colorTheme}>
      <CssBaseline />
      <DrawerStateProvider initialDrawerOpen={initialDrawerOpen}>
        <SnackbarAlertProvider>
          <Stack
            direction="row"
            sx={{
              minHeight: '100vh',
              backgroundColor: 'surface.containerLowest',
              alignItems: 'flex-start',
              overflowX: 'clip',
            }}
          >
            <Suspense fallback={null}>
              <NavDrawer />
            </Suspense>
            <Suspense>
              <PageTitle />
              <NavUser />
            </Suspense>
            <Stack sx={{ flexDirection: 'row', flexGrow: 1, minWidth: 0 }}>
              <Stack
                component="main"
                sx={{
                  flexGrow: 1,
                  // Floor the content column so the permanent filter drawer (md+)
                  // can't shrink it past a usable width. Below md the drawer is a
                  // temporary overlay that doesn't push content, so keep 0 there
                  // and let the card grids reflow freely. The floor matches the
                  // drawer's permanent breakpoint in SidebarShell.
                  minWidth: { xs: 0, md: 320 },
                }}
              >
                <Suspense>
                  <PullToRefresh />
                </Suspense>
                {children}
                <Footer />
              </Stack>
              <SidebarShell />
            </Stack>
          </Stack>
          <Analytics />
          <SpeedInsights />
        </SnackbarAlertProvider>
      </DrawerStateProvider>
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
