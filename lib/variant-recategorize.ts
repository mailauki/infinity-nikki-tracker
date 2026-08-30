import { SupabaseClient } from '@supabase/supabase-js'
import { ImageColumn, objectPathFor, objectPathFromUrl, publicUrlFor } from '@/lib/storage-paths'

const IMAGE_COLUMNS: ImageColumn[] = ['image_url', 'alt_image_url']

export type RecategorizeConfig = {
  table: 'outfit_variants' | 'makeup_variants'
  obtainedTable: 'obtained_outfit' | 'obtained_makeup'
  categoryColumn: 'outfit_category' | 'makeup_category'
  variantColumn: 'outfit_variant' | 'makeup_variant'
}

/**
 * Move a variant to a new category, carrying its slug and its storage objects.
 *
 * The slug encodes the category and the storage path encodes the slug (see
 * lib/storage-paths.ts), so changing a category without moving the files
 * orphans every image — the failure this function exists to prevent.
 *
 * Ordering is chosen so no failure can lose an image:
 *   1. block on slug collision (before anything is written)
 *   2. copy objects to the new folder (before the DB is touched)
 *   3. update the row in one statement
 *   4. leave the old objects alone, always
 *
 * A crash at any point leaves either the original state or an unreferenced
 * folder that costs disk and is caught by the verify queries in docs/queries/.
 */
export async function recategorizeVariant(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  config: RecategorizeConfig,
  args: { id: number; currentSlug: string; newSlug: string; newCategory: string }
): Promise<{ error: string } | { newSlug: string }> {
  const { id, currentSlug, newSlug, newCategory } = args

  // 1. Collision guard. The slug column is UNIQUE, so the DB would reject this
  // anyway — the point is to name the blocking variant instead of surfacing a
  // raw constraint violation.
  const { data: clash } = await supabase
    .from(config.table)
    .select('id, title')
    .eq('slug', newSlug)
    .neq('id', id)
    .maybeSingle()

  if (clash) {
    const name = clash.title ? ` ("${clash.title}")` : ''
    return {
      error: `"${newSlug}" already exists${name}. Resolve that variant before recategorizing this one.`,
    }
  }

  // Read the current image URLs so we know which objects exist to copy.
  const { data: current, error: readError } = await supabase
    .from(config.table)
    .select('image_url, alt_image_url')
    .eq('id', id)
    .single()

  if (readError) return { error: readError.message }

  // 2. Copy each present object to the new folder. Any failure aborts before
  // the DB write, leaving the variant exactly as it was.
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const newUrls: Partial<Record<ImageColumn, string>> = {}

  for (const column of IMAGE_COLUMNS) {
    const url = (current as Record<string, string | null>)[column]
    if (!url) continue

    const from = objectPathFromUrl(url)
    if (!from) continue

    const to = objectPathFor(config.table, newSlug, column)
    if (from === to) continue

    const { error: copyError } = await supabase.storage.from('images').copy(from, to)
    if (copyError) {
      return { error: `Could not copy ${column} to the new category folder: ${copyError.message}` }
    }
    newUrls[column] = publicUrlFor(baseUrl, to)
  }

  // 3. One statement, so the row can never be half-migrated. alt_slug and
  // `default` are deliberately absent — triggers own them.
  const { error: updateError } = await supabase
    .from(config.table)
    .update({
      slug: newSlug,
      [config.categoryColumn]: newCategory,
      ...newUrls,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) return { error: updateError.message }

  // The obtained table's variant FK cascades on slug update, but its own
  // category column does not — without this a user's collection row would
  // disagree with the variant it points at.
  const { error: obtainedError } = await supabase
    .from(config.obtainedTable)
    .update({ [config.categoryColumn]: newCategory })
    .eq(config.variantColumn, newSlug)

  if (obtainedError) return { error: obtainedError.message }

  // 4. Old objects are intentionally left in place. See the docstring.
  void currentSlug

  return { newSlug }
}
