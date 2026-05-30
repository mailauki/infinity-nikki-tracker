import { DashboardLinks, NavLink } from '@/lib/types/props'
import { Help, Info, Dashboard, AccountCircle } from '@mui/icons-material'

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
      title: 'Eureka',
      url: '/eureka',
      image: '/icons/eureka.png',
      items: [
        {
          title: 'Trials',
          url: '/eureka/trials',
          image: '/icons/realm-of-breakthrough.png',
        },
      ],
    },
    // {
    //   title: 'Outfits',
    //   url: '/outfits',
    //   image: '/icons/outfits.png',
    // 	items: [
    // 		{
    // 			title: 'Glow Up',
    // 			url: '/outfits/glowup',
    // 			image: '/icons/glowup.png',
    // 		},
    // 		{
    // 			title: 'Evolution',
    // 			url: '/outfits/evolution',
    // 			image: '/icons/evolution.png',
    // 		},
    // 	],
    // },
  ],
  navSecondary: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: <Dashboard />,
      adminOnly: true,
			items: [
				{ title: 'Sets', url: '/dashboard/eureka/sets' },
				{ title: 'Variants', url: '/dashboard/eureka/variants' },
				{ title: 'Trials', url: '/dashboard/eureka/trials' },
			],
    },
    {
      title: 'Profile',
      url: '/profile',
      icon: <AccountCircle />,
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
	},
}
