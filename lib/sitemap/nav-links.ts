import { NavLink } from '@/lib/types/props'
import { navLabel, pageEntry, type PageRoute } from './page-titles'

// Nav structure only: which routes appear in which section, in what order.
// Labels, images and icons all come from the route registry in page-titles.ts.
// Plain data — icons are keys rendered by `<NavIcon>` — so server code may
// import this too.
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
