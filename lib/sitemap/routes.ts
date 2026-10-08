// The single source of truth for every route: what it's called, where it sits
// in the nav, and whether it belongs in the sitemap. Edit a route here and the
// sidebar (`navLinksData`), page titles, admin links and app/sitemap.ts follow.
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

/** Main sidebar sections, top to bottom. */
export type NavSection = 'home' | 'collection' | 'account' | 'support'

/** Admin dashboard tabs, in order, with their header artwork. */
const ADMIN_TABS = {
  Outfits: '/icons/outfits.png',
  Eureka: '/icons/eureka.png',
  Other: '/icons/makeup.png',
} as const
type AdminTab = keyof typeof ADMIN_TABS

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
  /**
   * Sidebar section this route appears in. Rows show in registry order, so
   * reordering entries below reorders the sidebar.
   */
  section?: NavSection
  /** Nest under another sidebar row (an expandable sub-item). */
  parent?: string
  /** Only shown to admins. */
  adminOnly?: true
  /** Admin dashboard tab this list page appears under, in registry order. */
  adminTab?: AdminTab
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
    section: 'home',
  },

  // Collection domains — in sidebar order
  '/outfits': { nav: 'Outfits', image: '/icons/outfits.png', sitemap: true, section: 'collection' },
  '/eureka': {
    nav: 'Eureka',
    title: 'Eureka Sets',
    image: '/icons/eureka.png',
    sitemap: true,
    section: 'collection',
  },
  '/eureka/trials': {
    nav: 'Trials',
    image: '/icons/realm-of-breakthrough.png',
    icon: 'construction',
    sitemap: true,
    section: 'collection',
    parent: '/eureka',
  },
  '/makeup': { nav: 'Makeup', image: '/icons/makeup.png', sitemap: true, section: 'collection' },
  '/momo-cloaks': {
    nav: 'Cloaks',
    title: "Momo's Cloaks",
    image: '/icons/momo-cloak.png',
    sitemap: true,
    section: 'collection',
  },
  '/seasons': {
    nav: 'Seasons',
    title: 'Outfits by Season',
    image: '/icons/compendium.png',
    icon: 'book',
    sitemap: true,
    section: 'collection',
  },
  '/looks': {
    nav: 'Custom Looks',
    image: '/icons/wardrobe.png',
    icon: 'checkroom',
    section: 'collection',
  },
  '/eureka/sets': { nav: 'Eureka Sets' },
  '/looks/new': { nav: 'New Look' },
  '/search': { nav: 'Search' },

  // Account
  '/profile': { nav: 'Profile', icon: 'account', section: 'account' },
  '/settings': { nav: 'Settings', icon: 'settings', section: 'account' },
  '/admin': { nav: 'Admin', icon: 'admin', section: 'account', adminOnly: true },

  // Support
  '/about': { nav: 'About', icon: 'info', sitemap: true, section: 'support' },
  '/help': { nav: 'Help', icon: 'help', sitemap: true, section: 'support' },

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

  // Admin — grouped by dashboard tab, in tab order
  ...adminPages('/admin/outfits/sets', { nav: 'Sets', title: 'Outfit Sets', adminTab: 'Outfits' }),
  ...adminPages('/admin/outfits/variants', {
    nav: 'Pieces',
    title: 'Outfit Pieces',
    adminTab: 'Outfits',
  }),
  ...adminPages(
    '/admin/outfits/evolutions',
    { nav: 'Evolutions', adminTab: 'Outfits' },
    { add: false }
  ),
  ...adminPages('/admin/outfits/abilities', { nav: 'Abilities', adminTab: 'Outfits' }),
  ...adminPages('/admin/outfits/seasons', { nav: 'Seasons', adminTab: 'Outfits' }),
  ...adminPages('/admin/outfits/season-categories', {
    nav: 'Season Categories',
    adminTab: 'Outfits',
  }),
  ...adminPages('/admin/outfits/season-groups', { nav: 'Season Groups', adminTab: 'Outfits' }),

  ...adminPages('/admin/eureka/sets', { nav: 'Sets', title: 'Eureka Sets', adminTab: 'Eureka' }),
  ...adminPages('/admin/eureka/variants', {
    nav: 'Variants',
    title: 'Eureka Variants',
    adminTab: 'Eureka',
  }),
  ...adminPages('/admin/eureka/trials', { nav: 'Trials', adminTab: 'Eureka' }),

  ...adminPages('/admin/makeup/sets', { nav: 'Makeup Sets', adminTab: 'Other' }),
  ...adminPages('/admin/makeup/variants', { nav: 'Makeup Pieces', adminTab: 'Other' }),
  ...adminPages('/admin/momo-cloaks', { nav: "Momo's Cloaks", adminTab: 'Other' }),
  ...adminPages('/admin/locations', { nav: 'Locations', adminTab: 'Other' }),
  '/admin/feedback': { nav: 'Feedback', adminTab: 'Other' },
  '/admin/feedback/[id]': { nav: 'Feedback detail' },
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

// ---- Nav ------------------------------------------------------------------------
// Built entirely from the registry above — nothing to edit here when a route
// moves. Sections and tabs list their routes in registry order.
const ROUTES = Object.keys(PAGE_NAMES) as PageRoute[]

function link(url: PageRoute): NavLink {
  const { nav, image, icon, adminOnly } = pageEntry(url)
  const items = ROUTES.filter((route) => pageEntry(route).parent === url).map(link)
  return {
    title: nav,
    url,
    image,
    icon,
    ...(adminOnly && { adminOnly }),
    ...(items.length > 0 && { items }),
  }
}

const section = (name: NavSection) =>
  ROUTES.filter((route) => pageEntry(route).section === name && !pageEntry(route).parent).map(link)

export const navLinksData = {
  home: section('home'),
  collection: section('collection'),
  account: section('account'),
  support: section('support'),
  admin: {
    // A tab header links to its first list page, under the tab's own name.
    tabs: Object.entries(ADMIN_TABS).map(([title, image]): NavLink => {
      const items = ROUTES.filter((route) => pageEntry(route).adminTab === title).map(link)
      return { ...items[0], title, image, items }
    }),
  },
}
