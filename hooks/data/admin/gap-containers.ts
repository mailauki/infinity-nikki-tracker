import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import { toTitle } from '@/lib/utils'
import { ADMIN_ENTITIES, ADMIN_ENTITY_KEYS, type AdminEntityKey } from '@/lib/admin-entities'
import type { Database } from '@/lib/types/supabase'

// Entity table names are validated against ADMIN_ENTITIES at authoring time;
// Supabase's generated client only accepts its own literal table-name union,
// so this narrows the `string` field to that union for `.from()` calls.
// PostgREST caps responses at 1000 rows, so gap queries hand-paginate in
// 1000-row batches.
type TableName = keyof Database['public']['Tables']

type Client = Awaited<ReturnType<typeof createClient>>

const PAGE = 1000

export interface GapWorkItem {
  /** Unique row key, `${entity}:${slug}`. */
  key: string
  /** Container slug, or the record's own slug for non-variant entities. */
  slug: string
  title: string
  /** Row type label, e.g. "Evolution" or "Outfit Set". */
  kind: string
  imageUrl: string | null
  /** Gap variants inside this container missing that field (1 for non-variant entities). */
  noTitle: number
  noImage: number
  noDescription: number
  /** Edit form for the container itself. */
  editHref: string
}

/** Singular display label for a queue row's `kind`. */
const KIND_LABELS: Record<AdminEntityKey, string> = {
  'outfit-sets': 'Outfit Set',
  evolutions: 'Evolution',
  'outfit-variants': 'Outfit Variant',
  'makeup-sets': 'Makeup Set',
  'makeup-evolutions': 'Makeup Evolution',
  'makeup-variants': 'Makeup Variant',
  'momo-cloaks': "Momo's Cloak",
  'eureka-sets': 'Eureka Set',
  'eureka-variants': 'Eureka Variant',
  trials: 'Trial',
  seasons: 'Season',
  'season-categories': 'Season Category',
  abilities: 'Ability',
}

/** The three variant entities whose rows are grouped by owning-set container. */
const GROUPED_VARIANT_KEYS = new Set<AdminEntityKey>([
  'outfit-variants',
  'makeup-variants',
  'eureka-variants',
])

/**
 * Slugs that mean "no real owning set". Both `outfit_sets` and `makeup_sets`
 * use `standalone_pieces` (underscore) — the migration that introduced it is
 * live. The `standalone-pieces` (hyphen) variant is matched too as deliberate
 * defensiveness against a future rename or a differently-spelled slug landing
 * in either table.
 */
export const STANDALONE_SET_SLUGS = ['standalone_pieces', 'standalone-pieces']

export interface UnassignedPiece {
  /** `${entity}:${slug}`. */
  key: string
  entity: AdminEntityKey
  entityTitle: string
  slug: string
  title: string
  imageUrl: string | null
  missingTitle: boolean
  missingImage: boolean
  /** The piece's own variant edit form — never a container form. */
  editHref: string
}

const SIMPLE_ENTITY_KEYS = ADMIN_ENTITY_KEYS.filter((k) => !GROUPED_VARIANT_KEYS.has(k))

type Row = Record<string, unknown>

function isMissing(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '')
}

/**
 * A record "needs attention" when it is missing title or image — the two
 * fields the admin queue has always gated on (see the `admin_entity_stats`
 * SQL view: `gaps` is an OR of title/image only). Description is tracked for
 * display (`noDescription`) but deliberately never triggers inclusion —
 * almost every variant lacks one, so including it would swamp the queue.
 */
function gapOrFilter(tracksTitle: boolean, tracksImage: boolean): string {
  const parts: string[] = []
  if (tracksTitle) parts.push('title.is.null', 'title.eq.')
  if (tracksImage) parts.push('image_url.is.null', 'image_url.eq.')
  return parts.join(',')
}

function selectColumns(
  extra: string[],
  tracksTitle: boolean,
  tracksImage: boolean,
  tracksDescription: boolean
): string {
  const cols = ['slug', ...extra]
  if (tracksTitle) cols.push('title')
  if (tracksImage) cols.push('image_url')
  if (tracksDescription) cols.push('description')
  return cols.join(', ')
}

/** PostgREST caps a single response at 1000 rows; hand-paginate everything. */
async function fetchAllRows(
  queryFactory: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>
): Promise<Row[]> {
  const all: Row[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await queryFactory(from, from + PAGE - 1)
    if (error) throw error
    const batch = (data ?? []) as Row[]
    all.push(...batch)
    if (batch.length < PAGE) break
  }
  return all
}

/** One row per gap record — every entity except the three grouped variant tables. */
async function fetchSimpleGapItems(supabase: Client, key: AdminEntityKey): Promise<GapWorkItem[]> {
  const e = ADMIN_ENTITIES[key]
  const select = selectColumns([], e.tracksTitle, e.tracksImage, e.tracksDescription)
  const orFilter = gapOrFilter(e.tracksTitle, e.tracksImage)

  const rows = await fetchAllRows((from, to) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase.from(e.table as TableName).select(select)
    if (e.evolutionFilter === true) q = q.not('base_set', 'is', null)
    if (e.evolutionFilter === false) q = q.is('base_set', null)
    q = q.or(orFilter)
    return q.order('slug', { ascending: true }).range(from, to)
  })

  return rows.map((r) => {
    const slug = r.slug as string
    const rawTitle = e.tracksTitle ? ((r.title as string | null)?.trim() ?? '') : ''
    const imageUrl = e.tracksImage ? ((r.image_url as string | null) ?? null) : null

    return {
      key: `${key}:${slug}`,
      slug,
      title: rawTitle || toTitle(slug),
      kind: KIND_LABELS[key],
      imageUrl,
      noTitle: e.tracksTitle && isMissing(r.title) ? 1 : 0,
      noImage: e.tracksImage && isMissing(r.image_url) ? 1 : 0,
      noDescription: e.tracksDescription && isMissing(r.description) ? 1 : 0,
      editHref: `${e.editHref}/${slug}`,
    }
  })
}

interface VariantGroupConfig {
  entityKey: 'outfit-variants' | 'makeup-variants' | 'eureka-variants'
  ownerColumn: string
  ownerTable: TableName
  ownerTracksImage: boolean
  /** Only outfit-variants: base sets and evolutions route to separate edit forms via `base_set`. */
  routeToEvolutions: boolean
  /** The entity whose editHref/kind containers route to when `routeToEvolutions` is false. */
  containerKindKey: AdminEntityKey
  /**
   * The evolutions entity for this owner table, if it has one. `outfit_sets`
   * and `makeup_sets` both split base sets from evolutions via `base_set`;
   * `eureka_sets` has no such column. When set, each container's *label* is
   * resolved per-row from `base_set` — independent of `routeToEvolutions`.
   * Makeup sets `routeToEvolutions: false` (both share one edit route) but
   * still needs this for the label, so an evolution container isn't shown as
   * "Makeup Set".
   */
  evolutionEntityKey?: AdminEntityKey
}

const OUTFIT_VARIANT_CONFIG: VariantGroupConfig = {
  entityKey: 'outfit-variants',
  ownerColumn: 'outfit_set',
  ownerTable: 'outfit_sets',
  ownerTracksImage: true,
  routeToEvolutions: true,
  containerKindKey: 'outfit-sets',
  evolutionEntityKey: 'evolutions',
}

const MAKEUP_VARIANT_CONFIG: VariantGroupConfig = {
  entityKey: 'makeup-variants',
  ownerColumn: 'makeup_set',
  ownerTable: 'makeup_sets',
  ownerTracksImage: true,
  routeToEvolutions: false,
  containerKindKey: 'makeup-sets',
  evolutionEntityKey: 'makeup-evolutions',
}

const EUREKA_VARIANT_CONFIG: VariantGroupConfig = {
  entityKey: 'eureka-variants',
  ownerColumn: 'eureka_set',
  ownerTable: 'eureka_sets',
  ownerTracksImage: false,
  routeToEvolutions: false,
  containerKindKey: 'eureka-sets',
}

interface ContainerGroup {
  ownerSlug: string
  noTitle: number
  noImage: number
  noDescription: number
}

/**
 * Rows grouped by owning-set container. `outfit-variants` containers must be
 * resolved against `outfit_sets.base_set`: base-set containers route to the
 * sets edit form, evolution containers route to the evolutions edit form —
 * routing an evolution's variants to the base form would open a form that
 * deliberately excludes them (`isBaseVariant` in edit-outfit-set-form.tsx
 * filters to `v.outfit_set === baseSlug`).
 */
async function fetchGroupedContainers(
  supabase: Client,
  config: VariantGroupConfig
): Promise<GapWorkItem[]> {
  const e = ADMIN_ENTITIES[config.entityKey]
  const select = selectColumns(
    [config.ownerColumn],
    e.tracksTitle,
    e.tracksImage,
    e.tracksDescription
  )
  const orFilter = gapOrFilter(e.tracksTitle, e.tracksImage)

  const variantRows = await fetchAllRows((from, to) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q: any = supabase.from(e.table as TableName).select(select).or(orFilter)
    return q.order('slug', { ascending: true }).range(from, to)
  })

  // Group gap variants by owning-set slug. Pieces with no real owner (column
  // NULL, or one of STANDALONE_SET_SLUGS) are unassigned — they surface
  // individually via getUnassignedPieces() instead, so they're excluded from
  // container grouping entirely to avoid double-counting.
  const groups = new Map<string, ContainerGroup>()
  for (const row of variantRows) {
    const ownerSlug = (row[config.ownerColumn] as string | null) ?? null
    if (ownerSlug === null || STANDALONE_SET_SLUGS.includes(ownerSlug)) continue
    let group = groups.get(ownerSlug)
    if (!group) {
      group = { ownerSlug, noTitle: 0, noImage: 0, noDescription: 0 }
      groups.set(ownerSlug, group)
    }
    if (e.tracksTitle && isMissing(row.title)) group.noTitle++
    if (e.tracksImage && isMissing(row.image_url)) group.noImage++
    if (e.tracksDescription && isMissing(row.description)) group.noDescription++
  }

  const ownerCols = ['slug', 'title']
  if (config.ownerTracksImage) ownerCols.push('image_url')
  if (config.evolutionEntityKey !== undefined) ownerCols.push('base_set')
  const ownerSelect = ownerCols.join(', ')

  const ownerRows = await fetchAllRows((from, to) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q: any = supabase.from(config.ownerTable).select(ownerSelect)
    return q.order('slug', { ascending: true }).range(from, to)
  })

  const ownerBySlug = new Map(
    ownerRows.map((r) => [
      r.slug as string,
      {
        title: (r.title as string | null) ?? null,
        imageUrl: config.ownerTracksImage ? ((r.image_url as string | null) ?? null) : null,
        baseSet: config.evolutionEntityKey !== undefined ? ((r.base_set as string | null) ?? null) : null,
      },
    ])
  )

  const items: GapWorkItem[] = []
  for (const group of groups.values()) {
    const ownerSlug = group.ownerSlug
    const owner = ownerBySlug.get(ownerSlug)
    const evoKey = config.evolutionEntityKey
    const isEvolution = evoKey !== undefined && owner?.baseSet !== null && owner?.baseSet !== undefined

    // Label reflects whether the owning row is a base set or an evolution,
    // resolved per-container from `base_set` — independent of routing.
    const kind = evoKey !== undefined && isEvolution ? KIND_LABELS[evoKey] : KIND_LABELS[config.containerKindKey]

    // Routing: outfit-variants route evolutions to their own edit form.
    // Makeup-variants route everything through the shared `containerKindKey`
    // edit form regardless of label — `routeToEvolutions` is false there.
    const routeKey: AdminEntityKey =
      config.routeToEvolutions && evoKey !== undefined && isEvolution ? evoKey : config.containerKindKey
    const editBase = ADMIN_ENTITIES[routeKey].editHref

    items.push({
      key: `${config.entityKey}:${ownerSlug}`,
      slug: ownerSlug,
      title: owner?.title?.trim() || toTitle(ownerSlug),
      kind,
      imageUrl: owner?.imageUrl ?? null,
      noTitle: group.noTitle,
      noImage: group.noImage,
      noDescription: group.noDescription,
      // If the owning slug doesn't resolve to a real set (orphaned reference),
      // there is no edit form to route to — fall back to the entity's list.
      editHref: owner ? `${editBase}/${ownerSlug}` : e.listHref,
    })
  }

  return items
}

/** The owning-set column checked for "unassigned" per variant entity. */
const UNASSIGNED_OWNER_COLUMNS: Record<
  'outfit-variants' | 'makeup-variants' | 'eureka-variants',
  string
> = {
  'outfit-variants': OUTFIT_VARIANT_CONFIG.ownerColumn,
  'makeup-variants': MAKEUP_VARIANT_CONFIG.ownerColumn,
  'eureka-variants': EUREKA_VARIANT_CONFIG.ownerColumn,
}

/**
 * Gap-bearing variants whose owning-set column is NULL or a standalone-set
 * slug — they belong to no real set, so there is no container edit form to
 * group them under. Each surfaces individually, linking to its own edit form.
 */
async function fetchUnassignedPieces(
  supabase: Client,
  entityKey: 'outfit-variants' | 'makeup-variants' | 'eureka-variants'
): Promise<UnassignedPiece[]> {
  const e = ADMIN_ENTITIES[entityKey]
  const ownerColumn = UNASSIGNED_OWNER_COLUMNS[entityKey]
  const select = selectColumns([ownerColumn], e.tracksTitle, e.tracksImage, e.tracksDescription)
  const orFilter = gapOrFilter(e.tracksTitle, e.tracksImage)

  const rows = await fetchAllRows((from, to) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q: any = supabase.from(e.table as TableName).select(select).or(orFilter)
    return q.order('slug', { ascending: true }).range(from, to)
  })

  const unassignedRows = rows.filter((r) => {
    const owner = (r[ownerColumn] as string | null) ?? null
    return owner === null || STANDALONE_SET_SLUGS.includes(owner)
  })

  return unassignedRows.map((r) => {
    const slug = r.slug as string
    const rawTitle = e.tracksTitle ? ((r.title as string | null)?.trim() ?? '') : ''
    const imageUrl = e.tracksImage ? ((r.image_url as string | null) ?? null) : null

    return {
      key: `${entityKey}:${slug}`,
      entity: entityKey,
      entityTitle: e.title,
      slug,
      title: rawTitle || toTitle(slug),
      imageUrl,
      missingTitle: e.tracksTitle && isMissing(r.title),
      missingImage: e.tracksImage && isMissing(r.image_url),
      editHref: `${e.editHref}/${slug}`,
    }
  })
}

// Auth-dependent (createClient reads cookies), so React cache(), not `use cache`.
export const getUnassignedPieces = cache(async (): Promise<UnassignedPiece[]> => {
  const supabase = await createClient()

  const results = await Promise.all(
    (['outfit-variants', 'makeup-variants', 'eureka-variants'] as const).map((key) =>
      fetchUnassignedPieces(supabase, key)
    )
  )

  return results.flat()
})

// Auth-dependent (createClient reads cookies), so React cache(), not `use cache`.
export const getGapWorkItems = cache(async (): Promise<Record<AdminEntityKey, GapWorkItem[]>> => {
  const supabase = await createClient()

  const [simpleResults, outfitVariants, makeupVariants, eurekaVariants] = await Promise.all([
    Promise.all(SIMPLE_ENTITY_KEYS.map((key) => fetchSimpleGapItems(supabase, key))),
    fetchGroupedContainers(supabase, OUTFIT_VARIANT_CONFIG),
    fetchGroupedContainers(supabase, MAKEUP_VARIANT_CONFIG),
    fetchGroupedContainers(supabase, EUREKA_VARIANT_CONFIG),
  ])

  const result = {} as Record<AdminEntityKey, GapWorkItem[]>
  SIMPLE_ENTITY_KEYS.forEach((key, i) => {
    result[key] = simpleResults[i]
  })
  result['outfit-variants'] = outfitVariants
  result['makeup-variants'] = makeupVariants
  result['eureka-variants'] = eurekaVariants

  return result
})
