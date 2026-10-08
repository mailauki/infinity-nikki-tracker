// Prefer the stable site URL over VERCEL_URL, which is the per-deployment
// preview host — resolving metadataBase, sitemap entries or Stripe redirects
// against it would point them at a throwaway deployment.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
