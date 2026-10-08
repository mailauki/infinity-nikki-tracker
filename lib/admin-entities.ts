import { newPath, pageTitle } from '@/lib/sitemap/page-titles'

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
  | 'season-groups'
  | 'abilities'

export type GapKind = 'image' | 'alt-image' | 'title' | 'description' | 'season' | 'season-category'

/**
 * Synthetic gap-queue bucket for pieces in the "Standalone Pieces" set. Lives
 * here rather than in hooks/data/admin/gap-containers.ts because the client
 * gap queue imports it as a value — importing it from that module would pull
 * the server-only Supabase client into the browser bundle.
 *
 * Deliberately NOT an `AdminEntityKey`: it spans three variant tables and has
 * no row in the `admin_entity_stats` SQL view, so listing it among the real
 * entity keys would invent a phantom all-zero entity in the totals strip and
 * completeness list.
 */
export const STANDALONE_QUEUE_KEY = 'standalone-pieces'

/** A gap-queue bucket: any real admin entity, plus the standalone bucket. */
export type GapQueueKey = AdminEntityKey | typeof STANDALONE_QUEUE_KEY

export interface AdminEntity {
  key: AdminEntityKey
  title: string
  /** Postgres table backing this entity. */
  table: string
  tracksTitle: boolean
  tracksImage: boolean
  tracksDescription: boolean
  /**
   * Whether the backing table carries the nullable `seasons` /
   * `season_category` FK columns. Only outfit_sets, outfit_variants,
   * makeup_sets, makeup_variants and momo_cloaks do — the lookup tables
   * (seasons, season_categories, abilities) and the whole Eureka domain do
   * not, so their chips must stay hidden rather than reporting a false 0.
   */
  tracksSeason: boolean
  /**
   * Whether the backing table carries `alt_image_url`. Six tables do:
   * outfit_sets, outfit_variants, makeup_sets, makeup_variants, momo_cloaks
   * and seasons. Unlike season, this DOES gate queue inclusion — evolutions
   * have 0 rows missing a main image but 140 missing an alt image, so gating
   * on the main image alone reports that entity as clean when it is not.
   */
  tracksAltImage: boolean
  /**
   * Variant tables are the only ones the duplicate check applies to. Nothing
   * reads this yet — retained for the deferred alt_slug/duplicate-detection
   * spec.
   */
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

export const ADMIN_ENTITIES: Record<AdminEntityKey, AdminEntity> = {
  'outfit-sets': {
    key: 'outfit-sets',
    title: pageTitle('/admin/outfits/sets'),
    table: 'outfit_sets',
    tracksTitle: true,
    tracksImage: true,
    tracksDescription: true,
    tracksSeason: true,
    tracksAltImage: true,
    isVariant: false,
    evolutionFilter: false,
    addHref: newPath('/admin/outfits/sets'),
    listHref: '/admin/outfits/sets',
    editHref: '/admin/outfits/sets/edit',
  },
  evolutions: {
    key: 'evolutions',
    title: pageTitle('/admin/outfits/evolutions'),
    table: 'outfit_sets',
    tracksTitle: true,
    tracksImage: true,
    tracksDescription: true,
    tracksSeason: true,
    tracksAltImage: true,
    isVariant: false,
    evolutionFilter: true,
    listHref: '/admin/outfits/evolutions',
    editHref: '/admin/outfits/evolutions/edit',
  },
  'outfit-variants': {
    key: 'outfit-variants',
    title: pageTitle('/admin/outfits/variants'),
    table: 'outfit_variants',
    tracksTitle: true,
    tracksImage: true,
    tracksDescription: true,
    tracksSeason: true,
    tracksAltImage: true,
    isVariant: true,
    addHref: newPath('/admin/outfits/variants'),
    listHref: '/admin/outfits/variants',
    editHref: '/admin/outfits/variants/edit',
  },
  'makeup-sets': {
    key: 'makeup-sets',
    title: pageTitle('/admin/makeup/sets'),
    table: 'makeup_sets',
    tracksTitle: true,
    tracksImage: true,
    tracksDescription: true,
    tracksSeason: true,
    tracksAltImage: true,
    isVariant: false,
    evolutionFilter: false,
    addHref: newPath('/admin/makeup/sets'),
    listHref: '/admin/makeup/sets',
    editHref: '/admin/makeup/sets/edit',
  },
  'makeup-evolutions': {
    key: 'makeup-evolutions',
    title: 'Makeup Evolutions',
    table: 'makeup_sets',
    tracksTitle: true,
    tracksImage: true,
    tracksDescription: true,
    tracksSeason: true,
    tracksAltImage: true,
    isVariant: false,
    evolutionFilter: true,
    listHref: '/admin/makeup/sets',
    editHref: '/admin/makeup/sets/edit',
  },
  'makeup-variants': {
    key: 'makeup-variants',
    title: pageTitle('/admin/makeup/variants'),
    table: 'makeup_variants',
    tracksTitle: true,
    tracksImage: true,
    tracksDescription: true,
    tracksSeason: true,
    tracksAltImage: true,
    isVariant: true,
    addHref: newPath('/admin/makeup/variants'),
    listHref: '/admin/makeup/variants',
    editHref: '/admin/makeup/variants/edit',
  },
  'momo-cloaks': {
    key: 'momo-cloaks',
    title: pageTitle('/admin/momo-cloaks'),
    table: 'momo_cloaks',
    tracksTitle: true,
    tracksImage: true,
    tracksDescription: true,
    tracksSeason: true,
    tracksAltImage: true,
    isVariant: false,
    addHref: newPath('/admin/momo-cloaks'),
    listHref: '/admin/momo-cloaks',
    editHref: '/admin/momo-cloaks/edit',
  },
  'eureka-sets': {
    key: 'eureka-sets',
    title: pageTitle('/admin/eureka/sets'),
    table: 'eureka_sets',
    tracksTitle: true,
    tracksImage: false,
    tracksDescription: true,
    tracksSeason: false,
    tracksAltImage: false,
    isVariant: false,
    addHref: newPath('/admin/eureka/sets'),
    listHref: '/admin/eureka/sets',
    editHref: '/admin/eureka/sets/edit',
  },
  'eureka-variants': {
    key: 'eureka-variants',
    title: pageTitle('/admin/eureka/variants'),
    table: 'eureka_variants',
    tracksTitle: false,
    tracksImage: true,
    tracksDescription: false,
    tracksSeason: false,
    tracksAltImage: false,
    isVariant: true,
    addHref: newPath('/admin/eureka/variants'),
    listHref: '/admin/eureka/variants',
    editHref: '/admin/eureka/variants/edit',
  },
  trials: {
    key: 'trials',
    title: pageTitle('/admin/eureka/trials'),
    table: 'trials',
    tracksTitle: true,
    tracksImage: true,
    tracksDescription: true,
    tracksSeason: false,
    tracksAltImage: false,
    isVariant: false,
    addHref: newPath('/admin/eureka/trials'),
    listHref: '/admin/eureka/trials',
    editHref: '/admin/eureka/trials/edit',
  },
  seasons: {
    key: 'seasons',
    title: pageTitle('/admin/outfits/seasons'),
    table: 'seasons',
    tracksTitle: true,
    tracksImage: true,
    tracksDescription: true,
    tracksSeason: false,
    tracksAltImage: true,
    isVariant: false,
    addHref: newPath('/admin/outfits/seasons'),
    listHref: '/admin/outfits/seasons',
    editHref: '/admin/outfits/seasons/edit',
  },
  'season-categories': {
    key: 'season-categories',
    title: pageTitle('/admin/outfits/season-categories'),
    table: 'season_categories',
    tracksTitle: true,
    tracksImage: false,
    tracksDescription: true,
    tracksSeason: false,
    tracksAltImage: false,
    isVariant: false,
    addHref: newPath('/admin/outfits/season-categories'),
    listHref: '/admin/outfits/season-categories',
    editHref: '/admin/outfits/season-categories/edit',
  },
  'season-groups': {
    key: 'season-groups',
    title: pageTitle('/admin/outfits/season-groups'),
    table: 'season_groups',
    tracksTitle: true,
    tracksImage: false,
    tracksDescription: true,
    tracksSeason: false,
    tracksAltImage: false,
    isVariant: false,
    addHref: newPath('/admin/outfits/season-groups'),
    listHref: '/admin/outfits/season-groups',
    editHref: '/admin/outfits/season-groups/edit',
  },
  abilities: {
    key: 'abilities',
    title: pageTitle('/admin/outfits/abilities'),
    table: 'abilities',
    tracksTitle: true,
    tracksImage: false,
    tracksDescription: false,
    tracksSeason: false,
    tracksAltImage: false,
    isVariant: false,
    addHref: newPath('/admin/outfits/abilities'),
    listHref: '/admin/outfits/abilities',
    editHref: '/admin/outfits/abilities/edit',
  },
}

export const ADMIN_ENTITY_KEYS = Object.keys(ADMIN_ENTITIES) as AdminEntityKey[]

/** Domain groupings for the totals strip. Lookups appear only in the all-entries total. */
export const ADMIN_DOMAINS = [
  {
    title: 'Outfits',
    lead: 'outfit-variants',
    leadNoun: 'pieces',
    chips: [
      { key: 'outfit-sets', label: 'sets' },
      { key: 'evolutions', label: 'evo' },
    ],
  },
  {
    title: 'Eureka',
    lead: 'eureka-variants',
    leadNoun: 'variants',
    chips: [
      { key: 'eureka-sets', label: 'sets' },
      { key: 'trials', label: 'trials' },
    ],
  },
  {
    title: 'Makeup',
    lead: 'makeup-variants',
    leadNoun: 'pieces',
    chips: [
      { key: 'makeup-sets', label: 'sets' },
      { key: 'makeup-evolutions', label: 'evo' },
    ],
  },
  { title: "Momo's", lead: 'momo-cloaks', leadNoun: 'cloaks', chips: [] },
] as const satisfies ReadonlyArray<{
  title: string
  lead: AdminEntityKey
  leadNoun: string
  chips: ReadonlyArray<{ key: AdminEntityKey; label: string }>
}>
