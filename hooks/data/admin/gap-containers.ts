import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import { toTitle } from '@/lib/utils'
import {
  ADMIN_ENTITIES,
  ADMIN_ENTITY_KEYS,
  STANDALONE_QUEUE_KEY,
  type AdminEntityKey,
  type GapQueueKey,
} from '@/lib/admin-entities'
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
  noAltImage: number
  noDescription: number
  noSeason: number
  noSeasonCategory: number
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
  'season-groups': 'Season Group',
  abilities: 'Ability',
}

/** The three variant entities whose rows are grouped by owning-set container. */
const GROUPED_VARIANT_KEYS = new Set<AdminEntityKey>([
  'outfit-variants',
  'makeup-variants',
  'eureka-variants',
])

/**
 * Slugs treated as "not a groupable owning set". Both `outfit_sets` and
 * `makeup_sets` use `standalone_pieces` (underscore) — the migration that
 * introduced it is live. The `standalone-pieces` (hyphen) variant is matched
 * too as deliberate defensiveness against a future rename or a
 * differently-spelled slug landing in either table.
 *
 * Note these ARE real, titled set rows with working edit forms — not
 * placeholders and not dangling references. They're excluded from container
 * grouping on purpose: collapsing every standalone piece into a single
 * catch-all container would bury dozens of unrelated pieces behind one row,
 * so they surface individually via `getUnassignedPieces()` instead. Anything
 * with a genuinely NULL owner is routed there too.
 */
export const STANDALONE_SET_SLUGS = ['standalone_pieces', 'standalone-pieces']

/**
 * Owner tables that carry a "Standalone Pieces" set row. Those rows are real
 * and have their own edit forms, but they are containers for the standalone
 * bucket rather than collectible sets, so `fetchSimpleGapItems` excludes them
 * from the sets queues — see the filter there.
 */
const OWNER_TABLES_WITH_STANDALONE_SET = new Set<string>(['outfit_sets', 'makeup_sets'])

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
 * A record "needs attention" when it is missing title, image, or alt image.
 * Description is tracked for display (`noDescription`) but deliberately never
 * triggers inclusion — almost every variant lacks one, so including it would
 * swamp the queue.
 *
 * Alt image DOES gate, unlike season. Evolutions have 0 rows missing a main
 * image but 140 missing an alt image; gating on title/image alone reported
 * that entity as perfectly clean while 140 real gaps sat invisible. Note the
 * `admin_entity_stats` SQL view still computes `gaps` from title/image only,
 * so the completeness list and this queue can disagree for alt-image-only
 * gaps until that view is updated.
 *
 * Season and season-category stay non-gating. Coverage is excellent on
 * outfits (2 of 292 base sets, 32 of 6,561 variants missing a season) but
 * `makeup_variants` has the column entirely unpopulated — all 446 rows NULL,
 * and most `momo_cloaks` too. Gating on either would flood the queue with
 * rows carrying no real image work.
 */
function gapOrFilter(tracksTitle: boolean, tracksImage: boolean, tracksAltImage: boolean): string {
  const parts: string[] = []
  if (tracksTitle) parts.push('title.is.null', 'title.eq.')
  if (tracksImage) parts.push('image_url.is.null', 'image_url.eq.')
  if (tracksAltImage) parts.push('alt_image_url.is.null', 'alt_image_url.eq.')
  return parts.join(',')
}

function selectColumns(
  extra: string[],
  tracksTitle: boolean,
  tracksImage: boolean,
  tracksDescription: boolean,
  tracksSeason: boolean,
  tracksAltImage: boolean
): string {
  const cols = ['slug', ...extra]
  if (tracksTitle) cols.push('title')
  if (tracksImage) cols.push('image_url')
  if (tracksDescription) cols.push('description')
  if (tracksSeason) cols.push('seasons', 'season_category')
  if (tracksAltImage) cols.push('alt_image_url')
  return cols.join(', ')
}

/** PostgREST caps a single response at 1000 rows; hand-paginate everything. */
async function fetchAllRows(
  queryFactory: (
    from: number,
    to: number
  ) => PromiseLike<{ data: unknown[] | null; error: unknown }>
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
  const select = selectColumns(
    [],
    e.tracksTitle,
    e.tracksImage,
    e.tracksDescription,
    e.tracksSeason,
    e.tracksAltImage
  )
  /*
   * Simple entities gate on EVERY tracked field — title, image, alt image,
   * description and season — unlike the grouped variant path.
   *
   * These entities are sets/lookups where each row IS the record, so any gap
   * is directly actionable on that row's own edit form; there is no container
   * to flood. Gating on a subset undercounted badly, and for some entities
   * hid the only gap they had: seasons has 19 of 21 rows missing a
   * description and 0 missing a title/image, so the queue showed 2 rows and a
   * "No description" chip reading 0. Likewise outfit-sets showed 0 of its 2
   * season gaps, momo-cloaks 0 of its 74, season-categories 0 of its 23
   * description gaps.
   *
   * The grouped variant path deliberately does NOT do this. There, one row is
   * a whole set of variants, so admitting description would pull in 431
   * outfit containers whose only gap is a description almost no variant has —
   * the original swamping concern. Season is handled there by a separate
   * ungated counting pass instead, keeping inclusion image/title-gated.
   */
  const orFilter = [
    gapOrFilter(e.tracksTitle, e.tracksImage, e.tracksAltImage),
    ...(e.tracksDescription ? ['description.is.null', 'description.eq.'] : []),
    ...(e.tracksSeason ? ['seasons.is.null', 'season_category.is.null'] : []),
  ]
    .filter(Boolean)
    .join(',')

  const rows = await fetchAllRows((from, to) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase.from(e.table as TableName).select(select)
    if (e.evolutionFilter === true) q = q.not('base_set', 'is', null)
    if (e.evolutionFilter === false) q = q.is('base_set', null)
    q = q.or(orFilter)
    // The "Standalone Pieces" set rows in outfit_sets/makeup_sets back the
    // synthetic STANDALONE_QUEUE_KEY bucket, which lists their pieces
    // individually. Leaving the container rows in the sets queues too showed
    // the same concept in two places, so they are filtered out here — that
    // bucket is the one place standalone work is surfaced.
    if (OWNER_TABLES_WITH_STANDALONE_SET.has(e.table)) {
      q = q.not('slug', 'in', `(${STANDALONE_SET_SLUGS.join(',')})`)
    }
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
      noAltImage: e.tracksAltImage && isMissing(r.alt_image_url) ? 1 : 0,
      noDescription: e.tracksDescription && isMissing(r.description) ? 1 : 0,
      noSeason: e.tracksSeason && isMissing(r.seasons) ? 1 : 0,
      noSeasonCategory: e.tracksSeason && isMissing(r.season_category) ? 1 : 0,
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
  noAltImage: number
  noDescription: number
  noSeason: number
  noSeasonCategory: number
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
    e.tracksDescription,
    e.tracksSeason,
    e.tracksAltImage
  )
  const orFilter = gapOrFilter(e.tracksTitle, e.tracksImage, e.tracksAltImage)

  const variantRows = await fetchAllRows((from, to) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q: any = supabase
      .from(e.table as TableName)
      .select(select)
      .or(orFilter)
    return q.order('slug', { ascending: true }).range(from, to)
  })

  /*
   * Season counts come from a SEPARATE, ungated pass over every variant.
   *
   * Counting them off `variantRows` undercounted: that set is narrowed to rows
   * missing a title/image/alt-image, so a set whose images are complete but
   * whose variants all lack a season contributed nothing — `woodland_nesting`
   * (8 variants, no season, no image gaps) was silently dropped, showing 2
   * containers where 3 were correct.
   *
   * Folding season into `orFilter` instead would fix the count but change
   * which containers appear: +1 outfit container, but +34 makeup ones, since
   * `makeup_variants.seasons` is 100% NULL. That floods the queue with sets
   * carrying no image work. So inclusion stays image/title-gated while the
   * season *counts* describe the full variant set.
   */
  const seasonRows = e.tracksSeason
    ? await fetchAllRows((from, to) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const q: any = supabase
          .from(e.table as TableName)
          .select(`${config.ownerColumn}, seasons, season_category`)
          .or('seasons.is.null,season_category.is.null')
        return q.order('slug', { ascending: true }).range(from, to)
      })
    : []

  // Group gap variants by owning-set slug, so each row is one set with a
  // total across its variants and a link to that set's edit form. Two kinds of
  // row are skipped: NULL owners (nothing to group under — they go to
  // getUnassignedPieces()), and STANDALONE_SET_SLUGS, which would otherwise
  // collapse dozens of unrelated pieces into one catch-all container. The
  // latter get their own per-piece bucket (STANDALONE_QUEUE_KEY), so excluding
  // them here is what keeps the two from double-counting.
  const groups = new Map<string, ContainerGroup>()

  /** Groupable owner slug, or null for rows this queue does not group. */
  function ownerOf(row: Row): string | null {
    const slug = (row[config.ownerColumn] as string | null) ?? null
    if (slug === null || STANDALONE_SET_SLUGS.includes(slug)) return null
    return slug
  }

  function groupFor(ownerSlug: string): ContainerGroup {
    let group = groups.get(ownerSlug)
    if (!group) {
      group = {
        ownerSlug,
        noTitle: 0,
        noImage: 0,
        noAltImage: 0,
        noDescription: 0,
        noSeason: 0,
        noSeasonCategory: 0,
      }
      groups.set(ownerSlug, group)
    }
    return group
  }

  for (const row of variantRows) {
    const ownerSlug = ownerOf(row)
    if (ownerSlug === null) continue
    const group = groupFor(ownerSlug)
    if (e.tracksTitle && isMissing(row.title)) group.noTitle++
    if (e.tracksImage && isMissing(row.image_url)) group.noImage++
    if (e.tracksAltImage && isMissing(row.alt_image_url)) group.noAltImage++
    if (e.tracksDescription && isMissing(row.description)) group.noDescription++
  }

  // Season counts from the ungated pass. A container can appear here without
  // any gated rows (complete images, missing seasons) — `groupFor` creates it,
  // so it shows up under the season chips with 0 image/title gaps.
  for (const row of seasonRows) {
    const ownerSlug = ownerOf(row)
    if (ownerSlug === null) continue
    const group = groupFor(ownerSlug)
    if (isMissing(row.seasons)) group.noSeason++
    if (isMissing(row.season_category)) group.noSeasonCategory++
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
        baseSet:
          config.evolutionEntityKey !== undefined ? ((r.base_set as string | null) ?? null) : null,
      },
    ])
  )

  const items: GapWorkItem[] = []
  for (const group of groups.values()) {
    const ownerSlug = group.ownerSlug
    const owner = ownerBySlug.get(ownerSlug)
    const evoKey = config.evolutionEntityKey
    const isEvolution =
      evoKey !== undefined && owner?.baseSet !== null && owner?.baseSet !== undefined

    // Label reflects whether the owning row is a base set or an evolution,
    // resolved per-container from `base_set` — independent of routing.
    const kind =
      evoKey !== undefined && isEvolution
        ? KIND_LABELS[evoKey]
        : KIND_LABELS[config.containerKindKey]

    // Routing: outfit-variants route evolutions to their own edit form.
    // Makeup-variants route everything through the shared `containerKindKey`
    // edit form regardless of label — `routeToEvolutions` is false there.
    const routeKey: AdminEntityKey =
      config.routeToEvolutions && evoKey !== undefined && isEvolution
        ? evoKey
        : config.containerKindKey
    const editBase = ADMIN_ENTITIES[routeKey].editHref

    items.push({
      key: `${config.entityKey}:${ownerSlug}`,
      slug: ownerSlug,
      title: owner?.title?.trim() || toTitle(ownerSlug),
      kind,
      imageUrl: owner?.imageUrl ?? null,
      noTitle: group.noTitle,
      noImage: group.noImage,
      noAltImage: group.noAltImage,
      noDescription: group.noDescription,
      noSeason: group.noSeason,
      noSeasonCategory: group.noSeasonCategory,
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
 * Gap-bearing variants whose owning-set column is genuinely NULL — rows that
 * belong to no set at all, so there is no container edit form to reach them
 * through. Each surfaces individually, linking to its own variant edit form.
 *
 * Deliberately does NOT include STANDALONE_SET_SLUGS. Those rows are assigned
 * to a real, titled "Standalone Pieces" set with a working edit form, so
 * listing them as unassigned was simply wrong. They remain excluded from
 * container grouping (see STANDALONE_SET_SLUGS) — the trade-off is that they
 * no longer appear in either dashboard section; reach them via the variants
 * list page.
 *
 * Expect this to return nothing under healthy data: every variant row
 * currently has a non-null, resolvable owner. A non-empty result means real
 * referential damage, which is exactly what makes it worth surfacing.
 */
async function fetchUnassignedPieces(
  supabase: Client,
  entityKey: 'outfit-variants' | 'makeup-variants' | 'eureka-variants'
): Promise<UnassignedPiece[]> {
  const e = ADMIN_ENTITIES[entityKey]
  const ownerColumn = UNASSIGNED_OWNER_COLUMNS[entityKey]
  const select = selectColumns(
    [ownerColumn],
    e.tracksTitle,
    e.tracksImage,
    e.tracksDescription,
    e.tracksSeason,
    e.tracksAltImage
  )
  const orFilter = gapOrFilter(e.tracksTitle, e.tracksImage, e.tracksAltImage)

  const rows = await fetchAllRows((from, to) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q: any = supabase
      .from(e.table as TableName)
      .select(select)
      .or(orFilter)
    return q.order('slug', { ascending: true }).range(from, to)
  })

  const unassignedRows = rows.filter((r) => ((r[ownerColumn] as string | null) ?? null) === null)

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

/**
 * Gap-bearing variants assigned to a STANDALONE_SET_SLUGS set, as individual
 * per-piece rows rather than one catch-all container.
 *
 * These are excluded from container grouping (see `fetchGroupedContainers`),
 * so without this they'd appear nowhere on the dashboard. Each `GapWorkItem`
 * describes one variant: the counts are 0/1 like any non-variant entity, and
 * `editHref` points at the piece's own variant form — never the shared
 * "Standalone Pieces" set form, which is not where you fix a single piece.
 */
async function fetchStandalonePieces(
  supabase: Client,
  entityKey: 'outfit-variants' | 'makeup-variants' | 'eureka-variants'
): Promise<GapWorkItem[]> {
  const e = ADMIN_ENTITIES[entityKey]
  const ownerColumn = UNASSIGNED_OWNER_COLUMNS[entityKey]
  const select = selectColumns(
    [ownerColumn],
    e.tracksTitle,
    e.tracksImage,
    e.tracksDescription,
    e.tracksSeason,
    e.tracksAltImage
  )
  const orFilter = gapOrFilter(e.tracksTitle, e.tracksImage, e.tracksAltImage)

  const rows = await fetchAllRows((from, to) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q: any = supabase
      .from(e.table as TableName)
      .select(select)
      .or(orFilter)
      .in(ownerColumn, STANDALONE_SET_SLUGS)
    return q.order('slug', { ascending: true }).range(from, to)
  })

  return rows.map((r) => {
    const slug = r.slug as string
    const rawTitle = e.tracksTitle ? ((r.title as string | null)?.trim() ?? '') : ''

    return {
      key: `${entityKey}:${slug}`,
      slug,
      title: rawTitle || toTitle(slug),
      // Labelled by source table so the mixed list stays readable — the rows
      // come from three different variant tables.
      kind: KIND_LABELS[entityKey],
      imageUrl: e.tracksImage ? ((r.image_url as string | null) ?? null) : null,
      noTitle: e.tracksTitle && isMissing(r.title) ? 1 : 0,
      noImage: e.tracksImage && isMissing(r.image_url) ? 1 : 0,
      noAltImage: e.tracksAltImage && isMissing(r.alt_image_url) ? 1 : 0,
      noDescription: e.tracksDescription && isMissing(r.description) ? 1 : 0,
      noSeason: e.tracksSeason && isMissing(r.seasons) ? 1 : 0,
      noSeasonCategory: e.tracksSeason && isMissing(r.season_category) ? 1 : 0,
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
export const getGapWorkItems = cache(async (): Promise<Record<GapQueueKey, GapWorkItem[]>> => {
  const supabase = await createClient()

  const [simpleResults, outfitVariants, makeupVariants, eurekaVariants, standaloneResults] =
    await Promise.all([
      Promise.all(SIMPLE_ENTITY_KEYS.map((key) => fetchSimpleGapItems(supabase, key))),
      fetchGroupedContainers(supabase, OUTFIT_VARIANT_CONFIG),
      fetchGroupedContainers(supabase, MAKEUP_VARIANT_CONFIG),
      fetchGroupedContainers(supabase, EUREKA_VARIANT_CONFIG),
      Promise.all(
        (['outfit-variants', 'makeup-variants', 'eureka-variants'] as const).map((key) =>
          fetchStandalonePieces(supabase, key)
        )
      ),
    ])

  const result = {} as Record<GapQueueKey, GapWorkItem[]>
  SIMPLE_ENTITY_KEYS.forEach((key, i) => {
    result[key] = simpleResults[i]
  })
  result['outfit-variants'] = outfitVariants
  result['makeup-variants'] = makeupVariants
  result['eureka-variants'] = eurekaVariants
  // Flat per-piece rows from all three variant tables, sorted into one list.
  result[STANDALONE_QUEUE_KEY] = standaloneResults
    .flat()
    .sort((a, b) => a.title.localeCompare(b.title))

  return result
})
