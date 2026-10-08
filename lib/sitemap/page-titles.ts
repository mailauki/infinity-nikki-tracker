// The single source of truth for every route: what it's called, how it shows
// in the nav (and which nav section it sits in — `navLinksData` at the bottom),
// and whether it belongs in the sitemap (app/sitemap.ts lists the flagged ones).
//
// A page name used to be written in up to three independent places — the nav
// entry, the route's `metadata.title`, and PageShell's `title` prop. They
// drifted: /eureka was "Eureka" in the sidebar but "Eureka Sets" in the browser
// tab, and 30 of 68 routes had no metadata.title at all.
//
// This module has NO imports and NO JSX, deliberately, so metadata exports and
// Server Actions can read it without pulling client code into the server graph
// (see lib/admin-routes.ts for what that bleed breaks). Icons are therefore
// string keys here; lib/sitemap/nav-icons.tsx maps them to MUI components on
// the client.

/** Icon names a nav entry can use — rendered by `<NavIcon>`. */
export type NavIconKey =
  | 'account'
  | 'admin'
  | 'checkroom'
  | 'construction'
  | 'book'
  | 'help'
  | 'info'
  | 'settings'

/** A nav row, built from a registry entry by `link()`. */
export interface NavLink {
  title: string
  url: PageRoute
  image?: string
  icon?: NavIconKey
  adminOnly?: boolean
  items?: NavLink[]
}

export interface PageName {
  /** Sidebar / breadcrumb label. Kept short so nav rows don't wrap. */
  nav: string
  /**
   * Longer name for the browser tab and the page's h1. Omit when the nav label
   * already reads well on its own — `pageTitle()` falls back to `nav`.
   */
  title?: string
  /** Nav artwork (a `/public` path). */
  image?: string
  /** Nav icon, for rows without artwork or where both are shown. */
  icon?: NavIconKey
  /** List this public page in /sitemap.xml. */
  sitemap?: true
}

// An admin list page plus its add and edit forms. The form labels reuse the
// list's name in the singular — 'Outfit Sets' -> 'Add Outfit Set' / 'Edit
// Outfit Set' — so a section is named once. Pass `{ add: false }` for a list
// with no create form (evolutions are created from their base set).
function adminPages<const P extends string>(
  path: P,
  name: PageName
): Record<P | `${P}/new` | `${P}/edit/[slug]`, PageName>
function adminPages<const P extends string>(
  path: P,
  name: PageName,
  options: { add: false }
): Record<P | `${P}/edit/[slug]`, PageName>
function adminPages(path: string, name: PageName, { add = true } = {}) {
  const one = (name.title ?? name.nav).replace(/ies$/, 'y').replace(/s$/, '')
  return {
    [path]: name,
    ...(add && { [`${path}/new`]: { nav: `Add ${one}` } }),
    [`${path}/edit/[slug]`]: { nav: `Edit ${one}` },
  }
}

// Keyed by route path, matching the app/ directory structure. Dynamic segments
// use their literal bracket form ('/outfits/[slug]') but are generally absent:
// those routes build a title from the record they load, via generateMetadata.
export const PAGE_NAMES = {
  '/': {
    nav: 'Home',
    title: 'Infinity Nikki Tracker',
    image: '/infinity-nikki-logo.png',
    sitemap: true,
  },

  // Collection domains
  '/outfits': { nav: 'Outfits', image: '/icons/outfits.png', sitemap: true },
  '/seasons': {
    nav: 'Seasons',
    title: 'Outfits by Season',
    image: '/icons/compendium.png',
    icon: 'book',
    sitemap: true,
  },
  '/eureka': { nav: 'Eureka', title: 'Eureka Sets', image: '/icons/eureka.png', sitemap: true },
  '/eureka/sets': { nav: 'Eureka Sets' },
  '/eureka/trials': {
    nav: 'Trials',
    image: '/icons/realm-of-breakthrough.png',
    icon: 'construction',
    sitemap: true,
  },
  '/makeup': { nav: 'Makeup', image: '/icons/makeup.png', sitemap: true },
  '/momo-cloaks': {
    nav: 'Cloaks',
    title: "Momo's Cloaks",
    image: '/icons/momo-cloak.png',
    sitemap: true,
  },
  '/looks': { nav: 'Custom Looks', image: '/icons/wardrobe.png', icon: 'checkroom' },
  '/looks/new': { nav: 'New Look' },
  '/search': { nav: 'Search' },

  // Account
  '/profile': { nav: 'Profile', icon: 'account' },
  '/settings': { nav: 'Settings', icon: 'settings' },
  '/about': { nav: 'About', icon: 'info', sitemap: true },
  '/help': { nav: 'Help', icon: 'help', sitemap: true },

  // Legal — the (legal) route group is not part of the URL, so these are
  // registered at their real top-level paths.
  '/privacy-policy': { nav: 'Privacy', title: 'Privacy Policy', sitemap: true },
  '/terms-of-service': { nav: 'Terms', title: 'Terms of Service', sitemap: true },

  // Auth
  '/login': { nav: 'Log in' },
  '/sign-up': { nav: 'Sign up' },
  '/sign-up-success': { nav: 'Check your email' },
  '/forgot-password': { nav: 'Forgot password' },
  '/update-password': { nav: 'Update password' },
  '/auth/error': { nav: 'Authentication error' },

  // Admin
  '/admin': { nav: 'Admin', icon: 'admin' },
  '/admin/feedback': { nav: 'Feedback' },
  '/admin/feedback/[id]': { nav: 'Feedback detail' },

  ...adminPages('/admin/outfits/sets', { nav: 'Sets', title: 'Outfit Sets' }),
  ...adminPages('/admin/outfits/variants', { nav: 'Pieces', title: 'Outfit Pieces' }),
  ...adminPages('/admin/outfits/evolutions', { nav: 'Evolutions' }, { add: false }),
  ...adminPages('/admin/outfits/abilities', { nav: 'Abilities' }),
  ...adminPages('/admin/outfits/seasons', { nav: 'Seasons' }),
  ...adminPages('/admin/outfits/season-categories', { nav: 'Season Categories' }),
  ...adminPages('/admin/outfits/season-groups', { nav: 'Season Groups' }),
  ...adminPages('/admin/locations', { nav: 'Locations' }),

  ...adminPages('/admin/eureka/sets', { nav: 'Sets', title: 'Eureka Sets' }),
  ...adminPages('/admin/eureka/variants', { nav: 'Variants', title: 'Eureka Variants' }),
  ...adminPages('/admin/eureka/trials', { nav: 'Trials' }),

  ...adminPages('/admin/makeup/sets', { nav: 'Makeup Sets' }),
  ...adminPages('/admin/makeup/variants', { nav: 'Makeup Pieces' }),

  ...adminPages('/admin/momo-cloaks', { nav: "Momo's Cloaks" }),
} as const satisfies Record<string, PageName>

export type PageRoute = keyof typeof PAGE_NAMES

/** The full registry entry for a route. */
export function pageEntry(route: PageRoute): PageName {
  return PAGE_NAMES[route]
}

/** Static routes flagged for the sitemap, in registry order. */
export const SITEMAP_ROUTES = (Object.keys(PAGE_NAMES) as PageRoute[]).filter(
  (route) => pageEntry(route).sitemap
)

// Routes with a registered `/edit/[slug]` or `/new` child. Typing the helpers
// below on these means a typo, or a list page that has no form, fails to compile.
type EditableRoute = {
  [R in PageRoute]: `${R}/edit/[slug]` extends PageRoute ? R : never
}[PageRoute]
type NewableRoute = { [R in PageRoute]: `${R}/new` extends PageRoute ? R : never }[PageRoute]

/** `/admin/outfits/sets` + `abc` -> `/admin/outfits/sets/edit/abc` */
export function editPath(list: EditableRoute, slug: string): string {
  return `${list}/edit/${slug}`
}

/** `/admin/outfits/sets` -> `/admin/outfits/sets/new` */
export function newPath(list: NewableRoute): string {
  return `${list}/new`
}

/** Short label for sidebars and breadcrumbs. */
export function navLabel(route: PageRoute): string {
  return PAGE_NAMES[route].nav
}

/**
 * Full name for `metadata.title` and the page's h1. Falls back to the nav label
 * so a route only needs the longer form when it actually differs.
 */
export function pageTitle(route: PageRoute): string {
  const entry = pageEntry(route)
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
 * tail turned into a title so `/seasons/spring-encore` reads
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

// ---- Nav sections -------------------------------------------------------------
// Which routes appear in which section, in what order. Each row takes its label,
// image and icon from the registry above; pass overrides only where a row
// differs (the admin tab headers).
function link(url: PageRoute, extra: Partial<Omit<NavLink, 'url'>> = {}): NavLink {
  const { image, icon } = pageEntry(url)
  return { title: navLabel(url), url, image, icon, ...extra }
}

export const navLinksData = {
  home: [link('/')],
  collection: [
    link('/outfits'),
    link('/eureka', { items: [link('/eureka/trials')] }),
    link('/makeup'),
    link('/momo-cloaks'),
    link('/seasons'),
    link('/looks'),
  ],
  account: [link('/profile'), link('/settings'), link('/admin', { adminOnly: true })],
  support: [link('/about'), link('/help')],
  admin: {
    // Tab headers carry their own short title and artwork; their items take the
    // registry's nav labels.
    tabs: [
      link('/admin/outfits/sets', {
        title: 'Outfits',
        image: '/icons/outfits.png',
        items: [
          link('/admin/outfits/sets'),
          link('/admin/outfits/variants'),
          link('/admin/outfits/evolutions'),
          link('/admin/outfits/abilities'),
          link('/admin/outfits/seasons'),
          link('/admin/outfits/season-categories'),
          link('/admin/outfits/season-groups'),
        ],
      }),
      link('/admin/eureka/sets', {
        title: 'Eureka',
        image: '/icons/eureka.png',
        items: [
          link('/admin/eureka/sets'),
          link('/admin/eureka/variants'),
          link('/admin/eureka/trials'),
        ],
      }),
      link('/admin/makeup/sets', {
        title: 'Other',
        image: '/icons/makeup.png',
        items: [
          link('/admin/makeup/sets'),
          link('/admin/makeup/variants'),
          link('/admin/momo-cloaks'),
          link('/admin/locations'),
          link('/admin/feedback'),
        ],
      }),
    ],
  },
} satisfies Record<string, NavLink[] | { tabs: NavLink[] }>
