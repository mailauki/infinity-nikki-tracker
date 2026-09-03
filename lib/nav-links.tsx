import { AdminLinks, NavLink } from '@/lib/types/props'
import { navLabel } from '@/lib/page-titles'
import {
  Help,
  Info,
  AccountCircle,
  Settings,
  AdminPanelSettings,
  Forest,
  Construction,
  Checkroom,
} from '@mui/icons-material'

export const navLinksData: {
  home: NavLink[]
  collection: NavLink[]
  account: NavLink[]
  support: NavLink[]
  admin: AdminLinks
} = {
  home: [
    {
      title: navLabel('/'),
      url: '/',
      image: '/infinity-nikki-logo.png',
    },
  ],
  collection: [
    {
      title: navLabel('/outfits'),
      url: '/outfits',
      image: '/icons/outfits.png',
    },
    {
      title: navLabel('/eureka'),
      url: '/eureka',
      image: '/icons/eureka.png',
      items: [
        {
          title: navLabel('/eureka/trials'),
          url: '/eureka/trials',
          image: '/icons/realm-of-breakthrough.png',
          icon: <Construction />,
        },
      ],
    },
    {
      title: navLabel('/makeup'),
      url: '/makeup',
      image: '/icons/makeup.png',
    },
    {
      title: navLabel('/momo-cloaks'),
      url: '/momo-cloaks',
      image: '/icons/momo-cloak.png',
    },
    {
      title: navLabel('/seasons'),
      url: '/seasons',
      image: '/icons/compendium.png',
      icon: <Forest />,
    },
    {
      title: navLabel('/looks'),
      url: '/looks',
      image: '/icons/wardrobe.png',
      icon: <Checkroom />,
    },
  ],
  account: [
    {
      title: navLabel('/profile'),
      url: '/profile',
      icon: <AccountCircle />,
    },
    {
      title: navLabel('/settings'),
      url: '/settings',
      icon: <Settings />,
    },
    {
      title: navLabel('/admin'),
      url: '/admin',
      icon: <AdminPanelSettings />,
      adminOnly: true,
    },
  ],
  support: [
    {
      title: navLabel('/about'),
      url: '/about',
      icon: <Info />,
    },
    {
      title: navLabel('/help'),
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
          { title: navLabel('/admin/outfits/sets'), url: '/admin/outfits/sets' },
          { title: navLabel('/admin/outfits/variants'), url: '/admin/outfits/variants' },
          { title: navLabel('/admin/outfits/evolutions'), url: '/admin/outfits/evolutions' },
          { title: navLabel('/admin/outfits/abilities'), url: '/admin/outfits/abilities' },
          { title: navLabel('/admin/outfits/seasons'), url: '/admin/outfits/seasons' },
          {
            title: navLabel('/admin/outfits/season-categories'),
            url: '/admin/outfits/season-categories',
          },
        ],
      },
      {
        title: 'Eureka',
        url: '/admin/eureka/sets',
        image: '/icons/eureka.png',
        items: [
          { title: navLabel('/admin/eureka/sets'), url: '/admin/eureka/sets' },
          { title: navLabel('/admin/eureka/variants'), url: '/admin/eureka/variants' },
          { title: navLabel('/admin/eureka/trials'), url: '/admin/eureka/trials' },
        ],
      },
      {
        title: 'Other',
        url: '/admin/makeup/sets',
        image: '/icons/makeup.png',
        items: [
          { title: navLabel('/admin/makeup/sets'), url: '/admin/makeup/sets' },
          { title: navLabel('/admin/makeup/variants'), url: '/admin/makeup/variants' },
          { title: navLabel('/admin/momo-cloaks'), url: '/admin/momo-cloaks' },
          { title: navLabel('/admin/feedback'), url: '/admin/feedback' },
        ],
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
      seasonGroups: {
        title: 'Season Groups',
        list: '/admin/outfits/season-groups',
        add: '/admin/outfits/season-groups/new',
        edit: '/admin/outfits/season-groups/edit',
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
