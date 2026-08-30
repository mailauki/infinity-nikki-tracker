'use client'

import { FieldConfig, FieldValues } from '@/lib/types/form-fields'
import { deriveVariantSlug, STANDALONE_PIECES_SLUG } from '@/lib/variant-slug'

// A standalone piece has no set, so its slug derives from title + category
// (multiple pieces share a category and would otherwise collide). A set-owned
// variant derives from set + category, matching toSlugMakeup().
function isStandalone(v: FieldValues): boolean {
  return !v.makeup_set || v.makeup_set === STANDALONE_PIECES_SLUG
}

function deriveSlug(v: FieldValues): string {
  return deriveVariantSlug({
    set: (v.makeup_set as string | null) ?? null,
    category: (v.makeup_category as string | null) ?? null,
    title: (v.title as string | null) ?? null,
  })
}

export function makeupVariantFields(mode: 'add' | 'edit'): FieldConfig[] {
  return [
    {
      type: 'select',
      name: 'makeup_set',
      label: 'Makeup Set',
      optionsKey: 'makeupSets',
      // Most new pieces are standalone, so add mode starts there.
      // Edit mode seeds from the variant's own saved set instead.
      ...(mode === 'add' ? { defaultValue: STANDALONE_PIECES_SLUG } : {}),
    },
    { type: 'select', name: 'makeup_category', label: 'Category', optionsKey: 'makeupCategories' },
    { type: 'select', name: 'seasons', label: 'Season', optionsKey: 'seasons' },
    {
      type: 'select',
      name: 'season_category',
      label: 'Season Category',
      optionsKey: 'seasonCategories',
    },
    { type: 'rarity', name: 'rarity' },
    { type: 'toggle', name: 'style', label: 'Style', optionsKey: 'styles' },
    // Required only for standalone pieces: a set-owned variant inherits its
    // display name from the set, a loose piece has nothing to fall back on.
    { type: 'text', name: 'title', label: 'Title', required: (v) => isStandalone(v) },
    { type: 'textarea', name: 'description', label: 'Description' },
    {
      type: 'slug',
      name: 'slug',
      required: true,
      slugFrom: deriveSlug,
      helperText:
        mode === 'edit'
          ? 'Slug — a category change moves images automatically; editing this by hand does not'
          : 'Auto-generated from makeup set (or title) and category — edit if needed',
    },
    ...(mode === 'edit'
      ? [{ type: 'imagePair', name: 'image_url', table: 'makeup_variants' } as FieldConfig]
      : []),
  ]
}
