import InfoIcon from '@mui/icons-material/InfoOutline'
import DashboardIcon from '@mui/icons-material/Dashboard'
import AccountIcon from '@mui/icons-material/AccountCircle'
import ViewListIcon from '@mui/icons-material/ViewList'

export const navLinksData = {
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
      icon: <DashboardIcon />,
      adminOnly: true,
    },
    {
      title: 'Eureka Sets',
      url: '/eureka-set',
      icon: <ViewListIcon />,
      adminOnly: true,
      exclusiveItems: true,
      items: [
        {
          title: 'Add Eureka Set',
          url: '/eureka-set/new',
        },
        {
          title: 'Edit Eureka Set',
          url: '/eureka-set/edit',
        },
      ],
    },
    {
      title: 'Eureka Variants',
      url: '/eureka-variant',
      icon: <ViewListIcon />,
      adminOnly: true,
      exclusiveItems: true,
      items: [
        {
          title: 'Add Eureka Variant',
          url: '/eureka-variant/new',
        },
        {
          title: 'Edit Eureka Variant',
          url: '/eureka-variant/edit',
        },
      ],
    },
    {
      title: 'Profile',
      url: '/profile',
      icon: <AccountIcon />,
    },
  ],
  navExtra: [
    {
      title: 'About',
      url: '/about',
      icon: <InfoIcon />,
    },
  ],
}
