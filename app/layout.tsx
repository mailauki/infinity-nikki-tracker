import type { Metadata } from 'next'
import './globals.css'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter'
import { Roboto } from 'next/font/google'
import { ThemeProvider } from '@mui/material/styles'
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import theme from '@/lib/theme'
import { CssBaseline } from '@mui/material'

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
})

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Infinity Nikki Tracker',
  description: 'Track your collection from your favorite cozy open-world game Infinity Nikki',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={roboto.variable} suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="class" defaultMode="system" />
        <AppRouterCacheProvider options={{ key: 'css' }}>
          <ThemeProvider theme={theme} defaultMode="system">
            <CssBaseline />
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
