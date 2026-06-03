import { DashboardLinks, NavLink } from '@/lib/types/props'
import { Help, Info, Dashboard, AccountCircle, Settings } from '@mui/icons-material'

export const navLinksData: {
  home: NavLink
  navMain: NavLink[]
  navSecondary: NavLink[]
  navExtra: NavLink[]
  dashboard: DashboardLinks
} = {
  home: {
    title: 'Home',
    url: '/',
  },
  navMain: [
    {
      title: 'Outfits',
      url: '/outfits',
      image: '/icons/outfits.png',
      items: [
        {
          title: 'Sets',
          url: '/outfits/sets',
        },
        {
          title: 'Pieces',
          url: '/outfits/pieces',
        },
        {
          title: 'Accessories',
          url: '/outfits/accessories',
        },
        // {
        // 	title: 'Glow Up',
        // 	url: '/outfits/glowup',
        // 	image: '/icons/glowup.png',
        // },
        // {
        // 	title: 'Evolution',
        // 	url: '/outfits/evolution',
        // 	image: '/icons/evolution.png',
        // },
      ],
    },
    {
      title: 'Eureka',
      url: '/eureka',
      image: '/icons/eureka.png',
      items: [
        {
          title: 'Sets',
          url: '/eureka/sets',
        },
        {
          title: 'Trials',
          url: '/eureka/trials',
          image: '/icons/realm-of-breakthrough.png',
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: 'Profile',
      url: '/profile',
      icon: <AccountCircle />,
    },
    {
      title: 'Settings',
      url: '/settings',
      icon: <Settings />,
    },
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: <Dashboard />,
      adminOnly: true,
      items: [
        { title: 'Eureka Sets', url: '/dashboard/eureka/sets' },
        { title: 'Eureka Variants', url: '/dashboard/eureka/variants' },
        { title: 'Trials', url: '/dashboard/eureka/trials' },
        { title: 'Outfit Sets', url: '/dashboard/outfits/sets' },
        { title: 'Outfit Variants', url: '/dashboard/outfits/variants' },
        { title: 'Evolutions', url: '/dashboard/outfits/evolutions' },
      ],
    },
  ],
  navExtra: [
    {
      title: 'About',
      url: '/about',
      icon: <Info />,
    },
    {
      title: 'Help',
      url: '/help',
      icon: <Help />,
    },
  ],
  dashboard: {
    eureka: {
      sets: {
        add: '/eureka/sets/new',
        edit: '/eureka/sets/edit',
      },
      variants: {
        add: '/eureka/variants/new',
        edit: '/eureka/variants/edit',
      },
      trials: {
        add: '/eureka/trials/new',
        edit: '/eureka/trials/edit',
      },
    },
    outfits: {
      sets: {
        add: '/outfits/sets/new',
        edit: '/outfits/sets/edit',
      },
      variants: {
        add: '/outfits/variants/new',
        edit: '/outfits/variants/edit',
      },
      evolutions: {
        edit: '/outfits/evolutions/edit',
      },
    },
  },
}
