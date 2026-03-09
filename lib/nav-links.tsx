import { NavLink } from '@/lib/types/props'
import { Help, Info, Dashboard, AccountCircle } from '@mui/icons-material'

export const navLinksData: {
  home: NavLink
  navMain: NavLink[]
  navSecondary: NavLink[]
  navExtra: NavLink[]
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
        },
        {
          title: 'Missing',
          url: '/eureka/missing',
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: <Dashboard />,
      adminOnly: true,
      items: [
        {
          title: 'Add Eureka Set',
          url: '/eureka-set/new',
        },
        {
          title: 'Edit Eureka Set',
          url: '/eureka-set/edit',
        },
        {
          title: 'Add Eureka Variant',
          url: '/eureka-variant/new',
        },
        {
          title: 'Edit Eureka Variant',
          url: '/eureka-variant/edit',
        },
        {
          title: 'Add Trial',
          url: '/trial/new',
        },
        {
          title: 'Edit Trial',
          url: '/trial/edit',
        },
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
}
