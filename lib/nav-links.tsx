import InfoIcon from '@mui/icons-material/InfoOutline'
import DashboardIcon from '@mui/icons-material/Dashboard'

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
      title: 'About',
      url: '/about',
      icon: <InfoIcon />,
    },
  ],
}
