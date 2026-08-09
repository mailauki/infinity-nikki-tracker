import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import { toSlug, toTitle } from '@/lib/utils'
import { ADMIN_ENTITIES, type AdminEntityKey, type GapKind } from '@/lib/admin-entities'
import type { Database } from '@/lib/types/supabase'

// Entity table names are validated against ADMIN_ENTITIES at authoring time;
// Supabase's generated client only accepts its own literal table-name union,
// so this narrows the `string` field to that union for `.from()` calls.
type TableName = keyof Database['public']['Tables']

export const GAP_PAGE_SIZE = 10

export interface GapRow {
  slug: string
  title: string
  imageUrl: string | null
  editHref: string
}

type Client = Awaited<ReturnType<typeof createClient>>

/**
 * Base query for one entity, with the evolution split applied.
 * `outfit_sets` backs both outfit-sets and evolutions.
 */
function baseQuery(supabase: Client, key: AdminEntityKey, select: string) {
  const e = ADMIN_ENTITIES[key]
  let q = supabase.from(e.table as TableName).select(select, { count: 'exact' })
  if (e.evolutionFilter === true) q = q.not('base_set', 'is', null)
  if (e.evolutionFilter === false) q = q.is('base_set', null)
  return q
}

/** Apply the gap predicate. `duplicate` is handled separately — it is not a column test. */
function applyGap<T>(q: T, key: AdminEntityKey, gap: GapKind): T {
  const e = ADMIN_ENTITIES[key]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = q as any
  if (gap === 'image' && e.tracksImage) return query.or('image_url.is.null,image_url.eq.')
  if (gap === 'title' && e.tracksTitle) return query.or('title.is.null,title.eq.')
  if (gap === 'description' && e.tracksDescription)
    return query.or('description.is.null,description.eq.')
  return q
}

export const getGapRows = cache(
  async ({
    entity,
    gap,
    page,
  }: {
    entity: AdminEntityKey
    gap: GapKind
    page: number
  }): Promise<{ rows: GapRow[]; total: number }> => {
    const e = ADMIN_ENTITIES[entity]

    // A gap that this entity does not track has no rows by definition.
    if (gap === 'image' && !e.tracksImage) return { rows: [], total: 0 }
    if (gap === 'title' && !e.tracksTitle) return { rows: [], total: 0 }
    if (gap === 'description' && !e.tracksDescription) return { rows: [], total: 0 }
    if (gap === 'duplicate') return getDuplicateRows(entity, page)

    const supabase = await createClient()
    const from = (page - 1) * GAP_PAGE_SIZE

    const select = e.tracksTitle ? 'slug, title, image_url' : 'slug, image_url'
    let query = baseQuery(supabase, entity, select)
    query = applyGap(query, entity, gap)

    // .range() is mandatory: PostgREST caps at 1000 rows and outfit_variants
    // has ~2.6k rows in some gap sets.
    const { data, count, error } = await query
      .order('slug', { ascending: true })
      .range(from, from + GAP_PAGE_SIZE - 1)

    if (error) throw error

    const rows = (data ?? []).map((r) => {
      const row = r as unknown as {
        slug: string
        title?: string | null
        image_url: string | null
      }
      return {
        slug: row.slug,
        title: row.title?.trim() || toTitle(row.slug),
        imageUrl: row.image_url,
        editHref: `${e.editHref}/${row.slug}`,
      }
    })

    return { rows, total: count ?? 0 }
  }
)

/**
 * Title-derived duplicate detection, computed on the fly.
 *
 * The two slug schemes in app/admin/outfits/variants/fields.tsx never overlap —
 * a standalone piece slugs from title+category, a set piece from set+category —
 * so the same garment added both ways produces two different slugs. Grouping by
 * toSlug(title) surfaces those. Variants only; other entities have no such split.
 *
 * Untitled rows cannot participate (~2.6k outfit variants have no title), which
 * is why this is a detection aid, not an enforcement mechanism.
 */
async function getDuplicateRows(
  entity: AdminEntityKey,
  page: number
): Promise<{ rows: GapRow[]; total: number }> {
  const e = ADMIN_ENTITIES[entity]
  if (!e.isVariant || !e.tracksTitle) return { rows: [], total: 0 }

  const supabase = await createClient()

  // Titled variants only. Paginated because PostgREST caps at 1000 rows.
  const all: { slug: string; title: string | null }[] = []
  const PAGE = 1000
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(e.table as TableName)
      .select('slug, title')
      .not('title', 'is', null)
      .order('slug', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) throw error
    const batch = (data ?? []) as unknown as { slug: string; title: string | null }[]
    all.push(...batch)
    if (batch.length < PAGE) break
  }

  const groups = new Map<string, { slug: string; title: string | null }[]>()
  for (const row of all) {
    const key = toSlug(row.title?.trim() ?? '')
    if (!key) continue
    const bucket = groups.get(key)
    if (bucket) bucket.push(row)
    else groups.set(key, [row])
  }

  const dupes = [...groups.values()].filter((g) => g.length > 1).flat()
  const from = (page - 1) * GAP_PAGE_SIZE

  return {
    rows: dupes.slice(from, from + GAP_PAGE_SIZE).map((r) => ({
      slug: r.slug,
      title: r.title?.trim() || toTitle(r.slug),
      imageUrl: null,
      editHref: `${e.editHref}/${r.slug}`,
    })),
    total: dupes.length,
  }
}

/** Next row in the same gap set, for "Save & next gap". Null when exhausted. */
export const getNextGapSlug = cache(
  async ({
    entity,
    gap,
    afterSlug,
  }: {
    entity: AdminEntityKey
    gap: GapKind
    afterSlug: string
  }): Promise<string | null> => {
    if (gap === 'duplicate') return null

    const supabase = await createClient()
    let query = baseQuery(supabase, entity, 'slug')
    query = applyGap(query, entity, gap)

    const { data, error } = await query
      .gt('slug', afterSlug)
      .order('slug', { ascending: true })
      .limit(1)

    if (error) throw error
    return (data ?? [])[0] ? ((data ?? [])[0] as unknown as { slug: string }).slug : null
  }
)
