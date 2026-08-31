import { toSlug } from '@/lib/utils'

export const STANDALONE_PIECES_SLUG = 'standalone_pieces'

/**
 * A "bag" set (standalone, or no set at all) holds many pieces per category,
 * so its variants derive their slug from the title to stay unique. A real
 * base/evolution set has one variant per category, so set + category suffices.
 *
 * Mirrors the per-domain deriveSlug() in the variant admin field configs; the
 * shared copy exists so a recategorization computes exactly the slug a fresh
 * add would, rather than a second implementation that can drift.
 */
export function deriveVariantSlug(input: {
  set: string | null
  category: string | null
  title: string | null
}): string {
  const isBagSet = !input.set || input.set === STANDALONE_PIECES_SLUG
  const stem = isBagSet ? toSlug(input.title ?? '') : input.set
  return [stem, input.category].filter(Boolean).join('-')
}
