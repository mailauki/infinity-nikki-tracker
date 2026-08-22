// The single source of truth for what a route is called.
//
// A page name used to be written in up to three independent places — the nav
// entry in lib/nav-links.tsx, the route's `metadata.title`, and (since the
// reader-mode fix) PageShell's `title` prop. They drifted: /eureka was "Eureka"
// in the sidebar but "Eureka Sets" in the browser tab, and 30 of 68 routes had
// no metadata.title at all, so their tab fell back to the bare site name.
//
// This module has NO imports and NO JSX, deliberately. lib/nav-links.tsx pulls
// in MUI icon components, so a `metadata` export that reached for a title there
// would drag the icon graph into every server module that reads it — the same
// class of client/server bleed documented at length in lib/admin-routes.ts.
// Keep this file plain data so both sides can read it freely.

export interface PageName {
  /** Sidebar / breadcrumb label. Kept short so nav rows don't wrap. */
  nav: string
  /**
   * Longer name for the browser tab and the page's h1. Omit when the nav label
   * already reads well on its own — `pageTitle()` falls back to `nav`.
   */
  title?: string
}

// Keyed by route path, matching the app/ directory structure. Dynamic segments
// use their literal bracket form ('/outfits/[slug]') but are generally absent:
// those routes build a title from the record they load, via generateMetadata.
export const PAGE_NAMES = {
  '/': { nav: 'Home', title: 'Infinity Nikki Tracker' },

  // Collection domains
  '/outfits': { nav: 'Outfits' },
  '/outfits/seasons': { nav: 'Seasons', title: 'Outfits by Season' },
  '/eureka': { nav: 'Eureka', title: 'Eureka Sets' },
  '/eureka/sets': { nav: 'Eureka Sets' },
  '/eureka/trials': { nav: 'Trials' },
  '/makeup': { nav: 'Makeup' },
  '/momo-cloaks': { nav: "Momo's Cloaks" },
  '/looks': { nav: 'Custom Looks' },
  '/looks/new': { nav: 'New Look' },

  // Account
  '/profile': { nav: 'Profile' },
  '/settings': { nav: 'Settings' },
  '/about': { nav: 'About' },
  '/help': { nav: 'Help' },

  // Legal — the (legal) route group is not part of the URL, so these are
  // registered at their real top-level paths.
  '/privacy-policy': { nav: 'Privacy', title: 'Privacy Policy' },
  '/terms-of-service': { nav: 'Terms', title: 'Terms of Service' },

  // Auth
  '/login': { nav: 'Log in' },
  '/sign-up': { nav: 'Sign up' },
  '/sign-up-success': { nav: 'Check your email' },
  '/forgot-password': { nav: 'Forgot password' },
  '/update-password': { nav: 'Update password' },
  '/auth/error': { nav: 'Authentication error' },

  // Admin
  '/admin': { nav: 'Admin' },
  '/admin/feedback': { nav: 'Feedback' },
  '/admin/feedback/[id]': { nav: 'Feedback detail' },

  '/admin/outfits/sets': { nav: 'Sets', title: 'Outfit Sets' },
  '/admin/outfits/sets/new': { nav: 'Add Outfit Set' },
  '/admin/outfits/sets/edit/[slug]': { nav: 'Edit Outfit Set' },
  '/admin/outfits/variants': { nav: 'Variants', title: 'Outfit Variants' },
  '/admin/outfits/variants/new': { nav: 'Add Outfit Variant' },
  '/admin/outfits/variants/edit/[slug]': { nav: 'Edit Outfit Variant' },
  '/admin/outfits/evolutions': { nav: 'Evolutions' },
  '/admin/outfits/evolutions/edit/[slug]': { nav: 'Edit Evolution' },
  '/admin/outfits/abilities': { nav: 'Abilities' },
  '/admin/outfits/abilities/new': { nav: 'Add Ability' },
  '/admin/outfits/abilities/edit/[slug]': { nav: 'Edit Ability' },
  '/admin/outfits/seasons': { nav: 'Seasons' },
  '/admin/outfits/seasons/new': { nav: 'Add Season' },
  '/admin/outfits/seasons/edit/[slug]': { nav: 'Edit Season' },
  '/admin/outfits/season-categories': { nav: 'Season Categories' },
  '/admin/outfits/season-categories/new': { nav: 'Add Season Category' },
  '/admin/outfits/season-categories/edit/[slug]': { nav: 'Edit Season Category' },

  '/admin/eureka/sets': { nav: 'Sets', title: 'Eureka Sets' },
  '/admin/eureka/sets/new': { nav: 'Add Eureka Set' },
  '/admin/eureka/sets/edit/[slug]': { nav: 'Edit Eureka Set' },
  '/admin/eureka/variants': { nav: 'Variants', title: 'Eureka Variants' },
  '/admin/eureka/variants/new': { nav: 'Add Eureka Variant' },
  '/admin/eureka/variants/edit/[slug]': { nav: 'Edit Eureka Variant' },
  '/admin/eureka/trials': { nav: 'Trials' },
  '/admin/eureka/trials/new': { nav: 'Add Trial' },
  '/admin/eureka/trials/edit/[slug]': { nav: 'Edit Trial' },

  '/admin/makeup/sets': { nav: 'Makeup Sets' },
  '/admin/makeup/sets/new': { nav: 'Add Makeup Set' },
  '/admin/makeup/sets/edit/[slug]': { nav: 'Edit Makeup Set' },
  '/admin/makeup/variants': { nav: 'Makeup Variants' },
  '/admin/makeup/variants/new': { nav: 'Add Makeup Variant' },
  '/admin/makeup/variants/edit/[slug]': { nav: 'Edit Makeup Variant' },

  '/admin/momo-cloaks': { nav: "Momo's Cloaks" },
  '/admin/momo-cloaks/new': { nav: "Add Momo's Cloak" },
  '/admin/momo-cloaks/edit/[slug]': { nav: "Edit Momo's Cloak" },
} as const satisfies Record<string, PageName>

export type PageRoute = keyof typeof PAGE_NAMES

/** Short label for sidebars and breadcrumbs. */
export function navLabel(route: PageRoute): string {
  return PAGE_NAMES[route].nav
}

/**
 * Full name for `metadata.title` and the page's h1. Falls back to the nav label
 * so a route only needs the longer form when it actually differs.
 */
export function pageTitle(route: PageRoute): string {
  const entry: PageName = PAGE_NAMES[route]
  return entry.title ?? entry.nav
}

// Turns a URL slug into a display title: 'spring-encore' -> 'Spring Encore'.
// Kept here rather than imported from lib/utils so this module stays
// dependency-free (see the note at the top of the file).
function titleFromSlug(slug: string): string {
  return slug
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Resolves an arbitrary pathname to a breadcrumb label, for the app bar — which
 * renders on every route, including ones with no registry entry.
 *
 * Order: an exact registry hit wins; then the same path with its last segment
 * replaced by `[slug]`/`[id]`, so detail and edit routes resolve without an
 * entry per record; otherwise the nearest registered ancestor, with the unmatched
 * tail turned into a title so `/outfits/seasons/spring-encore` reads
 * "Spring Encore" rather than falling back to "Seasons".
 */
export function resolveNavLabel(pathname: string): string {
  const path = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  const names: Record<string, PageName> = PAGE_NAMES

  if (names[path]) return names[path].nav

  const segments = path.split('/')
  const last = segments.at(-1) ?? ''

  // '/looks/edit/abc' -> '/looks/edit/[slug]'
  for (const param of ['[slug]', '[id]', '[username]']) {
    const templated = [...segments.slice(0, -1), param].join('/')
    if (names[templated]) return names[templated].nav
  }

  // Nearest registered ancestor; name the leaf from its own slug.
  for (let i = segments.length - 1; i > 0; i--) {
    const ancestor = segments.slice(0, i).join('/') || '/'
    if (names[ancestor]) return titleFromSlug(last)
  }

  return titleFromSlug(last)
}
