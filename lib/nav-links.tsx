import { AdminLinks, NavLink } from '@/lib/types/props'
import { Help, Info, AccountCircle, Settings, AdminPanelSettings } from '@mui/icons-material'

export const navLinksData: {
  home: NavLink[]
  navMain: NavLink[]
  navSecondary: NavLink[]
  navExtra: NavLink[]
  admin: AdminLinks
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
      //   {
      //     title: 'Custom Looks',
      //     url: '/looks',
      //   },
      // ],
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
    // {
    //   title: 'Custom Looks',
    //   url: '/looks',
    //   icon: <AutoAwesome />,
    // },
    {
      title: 'Settings',
      url: '/settings',
      icon: <Settings />,
    },
    {
      title: 'Admin',
      url: '/admin',
      icon: <AdminPanelSettings />,
      adminOnly: true,
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
  admin: {
    tabs: [
      {
        title: 'Outfits',
        url: '/admin/outfits/sets',
        image: '/icons/outfits.png',
        items: [
          { title: 'Sets', url: '/admin/outfits/sets' },
          { title: 'Variants', url: '/admin/outfits/variants' },
          { title: 'Evolutions', url: '/admin/outfits/evolutions' },
          { title: 'Abilities', url: '/admin/outfits/abilities' },
        ],
      },
      {
        title: 'Eureka',
        url: '/admin/eureka/sets',
        image: '/icons/eureka.png',
        items: [
          { title: 'Sets', url: '/admin/eureka/sets' },
          { title: 'Variants', url: '/admin/eureka/variants' },
          { title: 'Trials', url: '/admin/eureka/trials' },
        ],
      },
    ],
    eureka: {
      sets: {
        title: 'Eureka Sets',
        list: '/admin/eureka/sets',
        add: '/admin/eureka/sets/new',
        edit: '/admin/eureka/sets/edit',
      },
      variants: {
        title: 'Eureka Variants',
        list: '/admin/eureka/variants',
        add: '/admin/eureka/variants/new',
        edit: '/admin/eureka/variants/edit',
      },
      trials: {
        title: 'Trials',
        list: '/admin/eureka/trials',
        add: '/admin/eureka/trials/new',
        edit: '/admin/eureka/trials/edit',
      },
    },
    outfits: {
      sets: {
        title: 'Outfit Sets',
        list: '/admin/outfits/sets',
        add: '/admin/outfits/sets/new',
        edit: '/admin/outfits/sets/edit',
      },
      variants: {
        title: 'Outfit Variants',
        list: '/admin/outfits/variants',
        add: '/admin/outfits/variants/new',
        edit: '/admin/outfits/variants/edit',
      },
      evolutions: {
        title: 'Evolutions',
        list: '/admin/outfits/evolutions',
        edit: '/admin/outfits/evolutions/edit',
      },
      abilities: {
        title: 'Abilities',
        list: '/admin/outfits/abilities',
        add: '/admin/outfits/abilities/new',
        edit: '/admin/outfits/abilities/edit',
      },
    },
  },
}
