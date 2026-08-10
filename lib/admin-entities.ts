import { navLinksData } from '@/lib/nav-links'

export type AdminEntityKey =
  | 'outfit-sets'
  | 'evolutions'
  | 'outfit-variants'
  | 'makeup-sets'
  | 'makeup-evolutions'
  | 'makeup-variants'
  | 'momo-cloaks'
  | 'eureka-sets'
  | 'eureka-variants'
  | 'trials'
  | 'seasons'
  | 'season-categories'
  | 'abilities'

export type GapKind = 'image' | 'title' | 'description' | 'duplicate'

export interface AdminEntity {
  key: AdminEntityKey
  title: string
  /** Postgres table backing this entity. */
  table: string
  tracksTitle: boolean
  tracksImage: boolean
  tracksDescription: boolean
  /** Variant tables are the only ones the duplicate check applies to. */
  isVariant: boolean
  /**
   * outfit_sets backs two entities. `true` = evolutions (base_set IS NOT NULL),
   * `false` = base sets (base_set IS NULL), `undefined` = not applicable.
   */
  evolutionFilter?: boolean
  addHref?: string
  listHref: string
  editHref: string
}

const A = navLinksData.admin

export const ADMIN_ENTITIES: Record<AdminEntityKey, AdminEntity> = {
  'outfit-sets': {
    key: 'outfit-sets', title: A.outfits.sets.title, table: 'outfit_sets',
    tracksTitle: true, tracksImage: true, tracksDescription: true, isVariant: false,
    evolutionFilter: false,
    addHref: A.outfits.sets.add, listHref: A.outfits.sets.list, editHref: A.outfits.sets.edit,
  },
  evolutions: {
    key: 'evolutions', title: A.outfits.evolutions.title, table: 'outfit_sets',
    tracksTitle: true, tracksImage: true, tracksDescription: true, isVariant: false,
    evolutionFilter: true,
    listHref: A.outfits.evolutions.list, editHref: A.outfits.evolutions.edit,
  },
  'outfit-variants': {
    key: 'outfit-variants', title: A.outfits.variants.title, table: 'outfit_variants',
    tracksTitle: true, tracksImage: true, tracksDescription: true, isVariant: true,
    addHref: A.outfits.variants.add, listHref: A.outfits.variants.list, editHref: A.outfits.variants.edit,
  },
  'makeup-sets': {
    key: 'makeup-sets', title: A.makeup.sets.title, table: 'makeup_sets',
    tracksTitle: true, tracksImage: true, tracksDescription: true, isVariant: false,
    evolutionFilter: false,
    addHref: A.makeup.sets.add, listHref: A.makeup.sets.list, editHref: A.makeup.sets.edit,
  },
  'makeup-evolutions': {
    key: 'makeup-evolutions', title: 'Makeup Evolutions', table: 'makeup_sets',
    tracksTitle: true, tracksImage: true, tracksDescription: true, isVariant: false,
    evolutionFilter: true,
    listHref: A.makeup.sets.list, editHref: A.makeup.sets.edit,
  },
  'makeup-variants': {
    key: 'makeup-variants', title: A.makeup.variants.title, table: 'makeup_variants',
    tracksTitle: true, tracksImage: true, tracksDescription: true, isVariant: true,
    addHref: A.makeup.variants.add, listHref: A.makeup.variants.list, editHref: A.makeup.variants.edit,
  },
  'momo-cloaks': {
    key: 'momo-cloaks', title: A.momoCloaks.cloaks.title, table: 'momo_cloaks',
    tracksTitle: true, tracksImage: true, tracksDescription: true, isVariant: false,
    addHref: A.momoCloaks.cloaks.add, listHref: A.momoCloaks.cloaks.list, editHref: A.momoCloaks.cloaks.edit,
  },
  'eureka-sets': {
    key: 'eureka-sets', title: A.eureka.sets.title, table: 'eureka_sets',
    tracksTitle: true, tracksImage: false, tracksDescription: true, isVariant: false,
    addHref: A.eureka.sets.add, listHref: A.eureka.sets.list, editHref: A.eureka.sets.edit,
  },
  'eureka-variants': {
    key: 'eureka-variants', title: A.eureka.variants.title, table: 'eureka_variants',
    tracksTitle: false, tracksImage: true, tracksDescription: false, isVariant: true,
    addHref: A.eureka.variants.add, listHref: A.eureka.variants.list, editHref: A.eureka.variants.edit,
  },
  trials: {
    key: 'trials', title: A.eureka.trials.title, table: 'trials',
    tracksTitle: true, tracksImage: true, tracksDescription: true, isVariant: false,
    addHref: A.eureka.trials.add, listHref: A.eureka.trials.list, editHref: A.eureka.trials.edit,
  },
  seasons: {
    key: 'seasons', title: A.outfits.seasons.title, table: 'seasons',
    tracksTitle: true, tracksImage: true, tracksDescription: true, isVariant: false,
    addHref: A.outfits.seasons.add, listHref: A.outfits.seasons.list, editHref: A.outfits.seasons.edit,
  },
  'season-categories': {
    key: 'season-categories', title: A.outfits.seasonCategories.title, table: 'season_categories',
    tracksTitle: true, tracksImage: false, tracksDescription: true, isVariant: false,
    addHref: A.outfits.seasonCategories.add, listHref: A.outfits.seasonCategories.list,
    editHref: A.outfits.seasonCategories.edit,
  },
  abilities: {
    key: 'abilities', title: A.outfits.abilities.title, table: 'abilities',
    tracksTitle: true, tracksImage: false, tracksDescription: false, isVariant: false,
    addHref: A.outfits.abilities.add, listHref: A.outfits.abilities.list, editHref: A.outfits.abilities.edit,
  },
}

export const ADMIN_ENTITY_KEYS = Object.keys(ADMIN_ENTITIES) as AdminEntityKey[]

const GAP_KINDS: GapKind[] = ['image', 'title', 'description', 'duplicate']

export function parseEntityKey(v: unknown): AdminEntityKey | null {
  return typeof v === 'string' && v in ADMIN_ENTITIES ? (v as AdminEntityKey) : null
}

export function parseGapKind(v: unknown): GapKind {
  return typeof v === 'string' && (GAP_KINDS as string[]).includes(v) ? (v as GapKind) : 'image'
}

/** Domain groupings for the totals strip. Lookups appear only in the all-entries total. */
export const ADMIN_DOMAINS = [
  { title: 'Outfits', lead: 'outfit-variants', leadNoun: 'variants',
    chips: [{ key: 'outfit-sets', label: 'sets' }, { key: 'evolutions', label: 'evo' }] },
  { title: 'Eureka', lead: 'eureka-variants', leadNoun: 'variants',
    chips: [{ key: 'eureka-sets', label: 'sets' }, { key: 'trials', label: 'trials' }] },
  { title: 'Makeup', lead: 'makeup-variants', leadNoun: 'variants',
    chips: [{ key: 'makeup-sets', label: 'sets' }, { key: 'makeup-evolutions', label: 'evo' }] },
  { title: "Momo's", lead: 'momo-cloaks', leadNoun: 'cloaks', chips: [] },
] as const satisfies ReadonlyArray<{
  title: string
  lead: AdminEntityKey
  leadNoun: string
  chips: ReadonlyArray<{ key: AdminEntityKey; label: string }>
}>
