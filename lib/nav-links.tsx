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
      items: [
        {
          title: 'Seasons',
          url: '/outfits/seasons',
        },
      ],
    },
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
    {
      title: 'Makeup',
      url: '/makeup',
      image: '/icons/makeup.png',
    },
    {
      title: "Momo's Cloaks",
      url: '/momo-cloaks',
      image: '/icons/momo-cloak.png',
    },
    {
      title: 'Custom Looks',
      url: '/looks',
      image: '/icons/wardrobe.png',
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
          { title: 'Seasons', url: '/admin/outfits/seasons' },
          { title: 'Season Categories', url: '/admin/outfits/season-categories' },
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
      {
        title: 'Makeup',
        url: '/admin/makeup/sets',
        image: '/icons/makeup.png',
        items: [
          { title: 'Sets', url: '/admin/makeup/sets' },
          { title: 'Variants', url: '/admin/makeup/variants' },
        ],
      },
      {
        title: "Momo's Cloaks",
        url: '/admin/momo-cloaks',
        image: '/icons/momo-cloak.png',
      },
    ],
    eureka: {
      sets: {
        title: 'Eureka Sets',
        list: '/admin/eureka/sets',
        add: '/admin/eureka/sets/new',
        edit: '/admin/eureka/sets/edit',
        main: '/eureka',
      },
      variants: {
        title: 'Eureka Variants',
        list: '/admin/eureka/variants',
        add: '/admin/eureka/variants/new',
        edit: '/admin/eureka/variants/edit',
        main: '/eureka',
      },
      trials: {
        title: 'Trials',
        list: '/admin/eureka/trials',
        add: '/admin/eureka/trials/new',
        edit: '/admin/eureka/trials/edit',
        main: '/eureka/trials',
      },
    },
    outfits: {
      sets: {
        title: 'Outfit Sets',
        list: '/admin/outfits/sets',
        add: '/admin/outfits/sets/new',
        edit: '/admin/outfits/sets/edit',
        main: '/outfits',
      },
      evolutions: {
        title: 'Evolutions',
        list: '/admin/outfits/evolutions',
        edit: '/admin/outfits/evolutions/edit',
        main: '/outfits',
      },
      abilities: {
        title: 'Abilities',
        list: '/admin/outfits/abilities',
        add: '/admin/outfits/abilities/new',
        edit: '/admin/outfits/abilities/edit',
        main: '/outfits',
      },
      seasons: {
        title: 'Seasons',
        list: '/admin/outfits/seasons',
        add: '/admin/outfits/seasons/new',
        edit: '/admin/outfits/seasons/edit',
        main: '/outfits',
      },
      variants: {
        title: 'Outfit Variants',
        list: '/admin/outfits/variants',
        add: '/admin/outfits/variants/new',
        edit: '/admin/outfits/variants/edit',
        main: '/outfits',
      },
      seasonCategories: {
        title: 'Season Categories',
        list: '/admin/outfits/season-categories',
        add: '/admin/outfits/season-categories/new',
        edit: '/admin/outfits/season-categories/edit',
        main: '/outfits',
      },
    },
    makeup: {
      sets: {
        title: 'Makeup Sets',
        list: '/admin/makeup/sets',
        add: '/admin/makeup/sets/new',
        edit: '/admin/makeup/sets/edit',
        main: '/makeup',
      },
      variants: {
        title: 'Makeup Variants',
        list: '/admin/makeup/variants',
        add: '/admin/makeup/variants/new',
        edit: '/admin/makeup/variants/edit',
        main: '/makeup',
      },
    },
    momoCloaks: {
      cloaks: {
        title: "Momo's Cloaks",
        list: '/admin/momo-cloaks',
        add: '/admin/momo-cloaks/new',
        edit: '/admin/momo-cloaks/edit',
        main: '/momo-cloaks',
      },
    },
  },
}
