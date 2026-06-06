import { DashboardLinks, NavLink } from '@/lib/types/props'
import {
  Help,
  Info,
  Dashboard,
  AccountCircle,
  Settings,
  Workspaces,
  Circle,
  GroupWork,
} from '@mui/icons-material'

export const navLinksData: {
  home: NavLink[]
  navMain: NavLink[]
  navSecondary: NavLink[]
  navExtra: NavLink[]
  dashboard: DashboardLinks
} = {
  home: [
    {
      title: 'Home',
      url: '/',
      image: '/infinity-nikki-logo.png',
    },
  ],
  navMain: [
    {
      title: 'Outfits',
      url: '/outfits',
      image: '/icons/outfits.png',
      // items: [
      //   {
      //     title: 'Sets',
      //     url: '/outfits/sets',
      //   },
      //   {
      //     title: 'Pieces',
      //     url: '/outfits/pieces',
      //   },
      //   {
      //     title: 'Accessories',
      //     url: '/outfits/accessories',
      //   },
      //   {
      //     title: 'Evolutions',
      //     url: '/outfits/evolutions',
      //     image: '/icons/evolution.png',
      //   },
      //   // {
      //   // 	title: 'Glow Up',
      //   // 	url: '/outfits/glowup',
      //   // 	image: '/icons/glowup.png',
      //   // },
      // ],
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
      // items: [
      // {
      //   title: 'My Collection',
      //   url: '/profile/collection',
      // },
      // {
      //   title: 'Missing',
      //   url: '/profile/missing',
      // },
      // {
      //   title: 'Custom Looks',
      //   url: '/profile/custom-looks',
      // },
      // ],
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
    },
    // {
    //   title: 'Dashboard',
    //   url: '/dashboard',
    //   icon: <Dashboard />,
    //   adminOnly: true,
    //   items: [
    //     { title: 'Eureka Sets', url: '/dashboard/eureka/sets' },
    //     { title: 'Eureka Variants', url: '/dashboard/eureka/variants' },
    //     { title: 'Trials', url: '/dashboard/eureka/trials' },
    //     { title: 'Outfit Sets', url: '/dashboard/outfits/sets' },
    //     { title: 'Outfit Variants', url: '/dashboard/outfits/variants' },
    //     { title: 'Evolutions', url: '/dashboard/outfits/evolutions' },
    //   ],
    // },
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
    tabs: [
      {
        title: 'Outfits',
        url: '/dashboard/outfits/sets',
        image: '/icons/outfits.png',
        items: [
          { title: 'Sets', url: '/dashboard/outfits/sets', icon: <Workspaces /> },
          { title: 'Variants', url: '/dashboard/outfits/variants', icon: <Circle /> },
          { title: 'Evolutions', url: '/dashboard/outfits/evolutions', icon: <GroupWork /> },
        ],
      },
      {
        title: 'Eureka',
        url: '/dashboard/eureka/sets',
        image: '/icons/eureka.png',
        items: [
          { title: 'Sets', url: '/dashboard/eureka/sets', icon: <Workspaces /> },
          { title: 'Variants', url: '/dashboard/eureka/variants', icon: <Circle /> },
          { title: 'Trials', url: '/dashboard/eureka/trials', icon: <GroupWork /> },
        ],
      },
    ],
    eureka: {
      sets: {
        title: 'Eureka Sets',
        list: '/dashboard/eureka/sets',
        add: '/dashboard/eureka/sets/new',
        edit: '/dashboard/eureka/sets/edit',
      },
      variants: {
        title: 'Eureka Variants',
        list: '/dashboard/eureka/variants',
        add: '/dashboard/eureka/variants/new',
        edit: '/dashboard/eureka/variants/edit',
      },
      trials: {
        title: 'Trials',
        list: '/dashboard/eureka/trials',
        add: '/dashboard/eureka/trials/new',
        edit: '/dashboard/eureka/trials/edit',
      },
    },
    outfits: {
      sets: {
        title: 'Outfit Sets',
        list: '/dashboard/outfits/sets',
        add: '/dashboard/outfits/sets/new',
        edit: '/dashboard/outfits/sets/edit',
      },
      variants: {
        title: 'Outfit Variants',
        list: '/dashboard/outfits/variants',
        add: '/dashboard/outfits/variants/new',
        edit: '/dashboard/outfits/variants/edit',
      },
      evolutions: {
        title: 'Evolutions',
        list: '/dashboard/outfits/evolutions',
        edit: '/dashboard/outfits/evolutions/edit',
      },
    },
  },
}
