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
  outfits: { sets: AdminLink; evolutions: AdminLink; abilities: AdminLink; seasons: AdminLink }
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

// Container-query grid: column counts respond to the CONTENT width, not the
// viewport, so grids reflow when the filter panel opens and narrows the content
// area. Wrap a grid in a Box with GRID_CONTAINER (an inline-size container) and
// give the grid GRID_COLUMNS_CONTAINER, which switches column count at
// container-width thresholds matching MUI's breakpoints (sm 600 / md 900).
export const GRID_CONTAINER = { containerType: 'inline-size' as const }

export const GRID_COLUMNS_CONTAINER = {
  gridTemplateColumns: 'repeat(3, 1fr)',
  '@container (min-width: 600px)': { gridTemplateColumns: 'repeat(4, 1fr)' },
  '@container (min-width: 900px)': { gridTemplateColumns: 'repeat(5, 1fr)' },
}

// Outfit grids pack more columns than the eureka grids (2 → 3 → 4 → 6 → 8).
// Same container-query approach: pair with GRID_CONTAINER on an ancestor.
export const OUTFIT_GRID_COLUMNS_CONTAINER = {
  gridTemplateColumns: 'repeat(2, 1fr)',
  '@container (min-width: 600px)': { gridTemplateColumns: 'repeat(3, 1fr)' },
  '@container (min-width: 900px)': { gridTemplateColumns: 'repeat(4, 1fr)' },
  '@container (min-width: 1200px)': { gridTemplateColumns: 'repeat(6, 1fr)' },
  '@container (min-width: 1536px)': { gridTemplateColumns: 'repeat(8, 1fr)' },
}

export const TABLE_ROW_HEIGHT = 50

export const MENU_PROPS = {
  slotProps: { paper: { style: { maxHeight: 36 * 6 } } },
}
