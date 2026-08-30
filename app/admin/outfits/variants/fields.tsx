'use client'

import { FieldConfig, FieldValues } from '@/lib/types/form-fields'
import { deriveVariantSlug, STANDALONE_PIECES_SLUG } from '@/lib/variant-slug'

// A "bag" set (standalone or no set) derives its slug from title + category so
// multiple pieces in the same category don't collide (e.g. `silverplume-hair`).
// A real base/evolution set derives from set + category (e.g. `moonlit-dress-hair`).
function isBagSet(v: FieldValues): boolean {
  return !v.outfit_set || v.outfit_set === STANDALONE_PIECES_SLUG
}

function deriveSlug(v: FieldValues): string {
  return deriveVariantSlug({
    set: (v.outfit_set as string | null) ?? null,
    category: (v.outfit_category as string | null) ?? null,
    title: (v.title as string | null) ?? null,
  })
}

export function outfitVariantFields(mode: 'add' | 'edit'): FieldConfig[] {
  return [
    {
      type: 'custom',
      name: 'outfit_set',
      component: 'groupedOutfitSet',
      // Most new variants are standalone pieces, so add mode starts there.
      // Edit mode seeds from the variant's own saved set instead.
      ...(mode === 'add' ? { defaultValue: STANDALONE_PIECES_SLUG } : {}),
    },
    { type: 'select', name: 'outfit_category', label: 'Category', optionsKey: 'outfitCategories' },
    { type: 'select', name: 'seasons', label: 'Season', optionsKey: 'seasons' },
    {
      type: 'select',
      name: 'season_category',
      label: 'Season Category',
      optionsKey: 'seasonCategories',
    },
    { type: 'rarity', name: 'rarity' },
    { type: 'toggle', name: 'style', label: 'Style', optionsKey: 'styles' },
    {
      type: 'custom',
      name: 'label',
      component: 'labelPair',
    },
    { type: 'text', name: 'title', label: 'Title', required: (v) => isBagSet(v) },
    { type: 'textarea', name: 'description', label: 'Description' },
    {
      type: 'slug',
      name: 'slug',
      required: true,
      slugFrom: deriveSlug,
      helperText:
        mode === 'edit'
          ? 'Slug — a category change moves images automatically; editing this by hand does not'
          : 'Auto-generated from outfit set (or title) and category — edit if needed',
    },
    ...(mode === 'edit'
      ? [{ type: 'imagePair', name: 'image_url', table: 'outfit_variants' } as FieldConfig]
      : []),
    // No `default` switch: the `trg_enforce_base_variant_default` DB trigger
    // derives the column on every write (true when the owning set's order is 1),
    // overwriting whatever the form posts. Editing it here was always a no-op.
  ]
}
