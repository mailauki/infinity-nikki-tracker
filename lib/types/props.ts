import { ReactNode } from 'react'

export type CategoryType = 'colors' | 'categories'

export type CardSize = 'xs' | 'sm' | 'md' | 'lg'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type CategoryFilter = 'head' | 'hands' | 'feet'

export type ObtainedFilter = 'missing' | 'obtained'

type Enumerate<N extends number, Acc extends number[] = []> = Acc['length'] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc['length']]>

type Range<F extends number, T extends number> = Exclude<Enumerate<T>, Enumerate<F>>

export type RarityFilter = Range<2, 6>

export type Percentage = Range<0, 101>

type AdminLink = {
  title: string
  list: string
  add?: string
  edit: string
}

export type AdminLinks = {
  tabs: NavLink[]
  eureka: { sets: AdminLink; variants: AdminLink; trials: AdminLink }
  outfits: { sets: AdminLink; variants: AdminLink; evolutions: AdminLink }
}

export interface NavLink {
  title: string
  url: string
  image?: string
  isActive?: boolean
  icon?: ReactNode
  adminOnly?: boolean
  exclusiveItems?: boolean
  items?: {
    title: string
    url: string
    image?: string
    icon?: ReactNode
  }[]
}

export const GRID_COLUMNS = {
  xs: '1fr 1fr 1fr',
  sm: '1fr 1fr 1fr 1fr',
  md: '1fr 1fr 1fr 1fr 1fr',
}
