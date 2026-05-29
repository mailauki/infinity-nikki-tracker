import type { Metadata } from 'next'
import './globals.css'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter'
import { Noto_Sans_JP, Roboto } from 'next/font/google'
import { ThemeProvider } from '@mui/material/styles'
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import theme from '@/lib/theme'
import { CssBaseline, Stack, Toolbar } from '@mui/material'
import { Analytics } from '@vercel/analytics/next'
import NavAppBar from '@/components/navbar/nav-appbar'
import NavRail from '@/components/navbar/nav-rail'
import { StyledToolbar } from '@/components/navbar/nav-styled'
import Footer from '@/components/navbar/nav-footer'
import Nav from '@/components/navbar/nav'

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
      new URL('/icon.png', defaultUrl),
      { url: '/icon-dark.png', media: '(prefers-color-scheme: dark)' },
    ],
    shortcut: ['/shortcut-icon.png'],
    apple: ['/apple-icon.png'],
  },
}

export default async function RootLayout({
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
            {/* {children} */}
            {/* <NavAppBar /> */}
            <Nav />
            <Stack
              direction="row"
              spacing={2}
              sx={{ minHeight: '100vh', p: 2, backgroundColor: 'surface.containerLowest' }}
            >
              {/* <NavRail /> */}
              <Stack spacing={2} sx={{ flex: 1, minWidth: '300px' }}>
                {/* <StyledToolbar /> */}
								<Toolbar />
                {children}
								<Toolbar />
              </Stack>
            </Stack>
            <Footer />
            <Analytics />
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
