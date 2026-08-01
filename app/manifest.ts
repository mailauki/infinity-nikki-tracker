import type { MetadataRoute } from 'next'
import { SPLASH_BACKGROUND_LIGHT, SPLASH_THEME_COLOR } from '@/lib/splash-colors'

// Manifest colors are static (one value for all users). The app has 4 themes,
// but the OS reads this before app JS runs, so we use the default Terracotta
// palette. A user who picked a different theme still sees a Terracotta-tinted
// splash/install — an inherent PWA constraint, not a bug.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Infinity Nikki Tracker',
    short_name: 'Nikki Tracker',
    description: 'Track your collection from your favorite cozy open-world game Infinity Nikki',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: SPLASH_BACKGROUND_LIGHT,
    theme_color: SPLASH_THEME_COLOR,
    icons: [
      {
        src: '/icons/pwa/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/pwa/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/pwa/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
