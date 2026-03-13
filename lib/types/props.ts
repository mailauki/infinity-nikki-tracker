import { ReactNode } from 'react'

export type CategoryType = 'colors' | 'categories'

export type CardSize = 'xs' | 'sm' | 'md' | 'lg'

// export type ResponsiveCardSize =
//   | CardSize
//   | { xs?: CardSize; sm?: CardSize; md?: CardSize; lg?: CardSize }

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type CategoryFilter = 'Head' | 'Hands' | 'Feet'

export type ObtainedFilter = 'Missing' | 'Obtained'

export type RarityFilter = 2 | 3 | 4 | 5

export interface NavLink {
  title: string
  url: string
  image?: string
  isActive?: boolean
  icon?: ReactNode
  adminOnly?: boolean
  exclusiveItems?: boolean
  items?: { title: string; url: string }[]
}
