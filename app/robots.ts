import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/sitemap/site-url'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/settings', '/profile', '/auth'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
