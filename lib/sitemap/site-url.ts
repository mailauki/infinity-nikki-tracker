// The site's canonical origin, for metadataBase, sitemap entries and Stripe
// redirects. NEXT_PUBLIC_SITE_URL wins when set. Otherwise prefer Vercel's
// production domain over VERCEL_URL: VERCEL_URL is the per-deployment host
// (`…-git-branch-….vercel.app`), so resolving against it would point canonical
// URLs, og:images and sitemap entries at a throwaway deployment.
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (vercelHost ? `https://${vercelHost}` : 'http://localhost:3000')
