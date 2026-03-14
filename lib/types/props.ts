import { ReactNode } from 'react'

export type CategoryType = 'colors' | 'categories'

export type CardSize = 'xs' | 'sm' | 'md' | 'lg'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type CategoryFilter = 'head' | 'hands' | 'feet'

export type ObtainedFilter = 'missing' | 'obtained'

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
