import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter'
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
import {
  DEFAULT_TEXT_SCALE,
  TEXT_SCALE_STORAGE_KEY,
  rootFontSizePx,
  toTextScale,
  type TextScale,
} from '@/lib/text-scale'
import { NAV_DRAWER_STORAGE_KEY, SIDEBAR_STORAGE_KEY } from '@/lib/layout-constants'
import { SPLASH_BACKGROUND_DARK, SPLASH_BACKGROUND_LIGHT } from '@/lib/splash-colors'
import LayoutShell from '@/components/navbar/layout-shell'
import { OG_ALT } from '@/lib/og-image'
import SplashScreen from './splash-screen'

import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'

// Prefer the stable site URL over VERCEL_URL, which is the per-deployment
// preview host — resolving metadataBase against it would point every og:image
// and canonical URL at a throwaway deployment. Same precedence the Stripe
// checkout route uses for its redirect URLs.
const defaultUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

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
  // Points at the committed public/opengraph-image.png. There is deliberately
  // no app/opengraph-image.tsx: that file convention's generated URL overrides
  // this `images` entry, which previously left og:image on the route while
  // twitter:image used the file. The layout template now lives at
  // lib/og-image-template.tsx and is rasterized by scripts/generate-og-image.mjs.
  //
  // The layout is composed so a center-crop to 630x630 — what WhatsApp, Slack
  // compact previews, and LinkedIn thumbnails do — keeps every word readable;
  // public/opengraph-image-square.png is that crop, committed for review, and
  // app/__tests__/opengraph-image.test.ts fails if text ever drifts out of it.
  openGraph: {
    type: 'website',
    siteName: 'Infinity Nikki Tracker',
    title: 'Infinity Nikki Tracker',
    description: 'Track your collection from your favorite cozy open-world game Infinity Nikki',
    url: '/',
    locale: 'en_US',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: OG_ALT,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Infinity Nikki Tracker',
    description: 'Track your collection from your favorite cozy open-world game Infinity Nikki',
    images: ['/opengraph-image.png'],
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
  let textScale: TextScale = DEFAULT_TEXT_SCALE
  const user_id = await getUserID()

  if (user_id) {
    const prefs = await getPreferences(user_id)
    const saved = prefs.color_theme
    if (saved && (VALID_THEMES as string[]).includes(saved)) colorTheme = saved as ColorTheme
    textScale = toTextScale(prefs.text_scale)
  }

  // Seed each drawer's open state from its persisted cookie so the content-pushing
  // drawers render at their final width on first paint (avoids a CLS shift).
  const cookieStore = await cookies()
  const initialDrawerOpen = cookieStore.get(NAV_DRAWER_STORAGE_KEY)?.value === 'true'
  const initialSidebarOpen = cookieStore.get(SIDEBAR_STORAGE_KEY)?.value === 'true'

  return (
    <ThemeClientProvider colorTheme={colorTheme} textScale={textScale}>
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
    <html suppressHydrationWarning lang="en">
      <body>
        <InitColorSchemeScript attribute="class" defaultMode="system" />
        {/*
          Applies the saved text scale before first paint. The preference is
          owned by the database, but the server render happens before we know
          the viewer, and reading it after hydration would let every page paint
          at the default size and then visibly resize. localStorage is the only
          store readable this early; ColorThemeProvider keeps it mirrored.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('${TEXT_SCALE_STORAGE_KEY}');var m={compact:${rootFontSizePx('compact')},comfortable:${rootFontSizePx('comfortable')},large:${rootFontSizePx('large')}};if(s&&m[s])document.documentElement.style.fontSize=m[s]+'px'}catch(e){}})()`,
          }}
        />
        <AppRouterCacheProvider options={{ key: 'css' }}>
          <Suspense fallback={<SplashScreen />}>
            <ThemedApp>{children}</ThemedApp>
          </Suspense>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
