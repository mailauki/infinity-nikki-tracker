import InfoIcon from '@mui/icons-material/InfoOutline'
import DashboardIcon from '@mui/icons-material/Dashboard'
import AccountIcon from '@mui/icons-material/AccountCircle'

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
			title: "Eureka Sets",
			url: '/eureka-set',
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
