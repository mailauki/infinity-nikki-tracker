import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter'
import { Noto_Sans_JP, Roboto } from 'next/font/google'
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import ThemeClientProvider from '@/components/theme-client-provider'
import { CssBaseline } from '@mui/material'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Suspense } from 'react'
import { DrawerStateProvider } from '@/components/navbar/navbar-toolbar-context'
import SnackbarAlertProvider from '@/components/snackbar-provider'
import { connection } from 'next/server'
import { cookies } from 'next/headers'
import type { ColorTheme } from '@/lib/types/eureka'
import { getUserID } from '@/hooks/user'
import { getPreferences } from '@/hooks/data/preferences'
import { NAV_DRAWER_STORAGE_KEY, SIDEBAR_STORAGE_KEY } from '@/lib/layout-constants'
import { SPLASH_BACKGROUND_DARK, SPLASH_BACKGROUND_LIGHT } from '@/lib/splash-colors'
import LayoutShell from '@/components/navbar/layout-shell'

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
    title: 'Infinity Nikki Tracker',
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: SPLASH_BACKGROUND_LIGHT },
    { media: '(prefers-color-scheme: dark)', color: SPLASH_BACKGROUND_DARK },
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

  // Seed each drawer's open state from its persisted cookie so the content-pushing
  // drawers render at their final width on first paint (avoids a CLS shift).
  const cookieStore = await cookies()
  const initialDrawerOpen = cookieStore.get(NAV_DRAWER_STORAGE_KEY)?.value === 'true'
  const initialSidebarOpen = cookieStore.get(SIDEBAR_STORAGE_KEY)?.value === 'true'

  return (
    <ThemeClientProvider colorTheme={colorTheme}>
      <CssBaseline />
      <DrawerStateProvider
        initialDrawerOpen={initialDrawerOpen}
        initialSidebarOpen={initialSidebarOpen}
      >
        <SnackbarAlertProvider>
          <LayoutShell>{children}</LayoutShell>
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
