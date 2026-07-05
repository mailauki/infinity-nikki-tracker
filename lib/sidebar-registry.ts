import { DEFAULT_SIDEBAR_WIDTH } from '@/lib/layout-constants'

// Which routes show a content-pushing Sidebar, and how wide it is. A match
// function (not a plain path array) so dynamic routes like /looks/edit/[slug]
// can be expressed with prefix matching. Consumed by the Sidebar's margin-math
// consumers (sidebar-content-shim, NavBar, NavBarToolbar) to reserve right-margin
// when the sidebar is open.
export type SidebarConfig = { width: number }

const SIDEBAR_ROUTES: Array<{ match: (pathname: string) => boolean; config: SidebarConfig }> = [
  { match: (p) => p === '/eureka' || p === '/outfits', config: { width: DEFAULT_SIDEBAR_WIDTH } },
  {
    match: (p) => p === '/looks/new' || p.startsWith('/looks/edit/'),
    config: { width: DEFAULT_SIDEBAR_WIDTH },
  },
]

export function sidebarConfigFor(pathname: string): SidebarConfig | null {
  return SIDEBAR_ROUTES.find((route) => route.match(pathname))?.config ?? null
}
