'use client'

import { FieldConfig, FieldValues } from '@/lib/types/form-fields'
import { toSlug } from '@/lib/utils'

// A standalone piece has no set, so its slug derives from title + category
// (multiple pieces share a category and would otherwise collide). A set-owned
// variant derives from set + category, matching toSlugMakeup().
function isStandalone(v: FieldValues): boolean {
  return !v.makeup_set
}

function deriveSlug(v: FieldValues): string {
  const category = String(v.makeup_category ?? '')
  if (!isStandalone(v)) {
    return [String(v.makeup_set), category].filter(Boolean).join('-')
  }
  return [toSlug(String(v.title ?? '')), category].filter(Boolean).join('-')
}

export function makeupVariantFields(mode: 'add' | 'edit'): FieldConfig[] {
  return [
    { type: 'select', name: 'makeup_set', label: 'Makeup Set', optionsKey: 'makeupSets' },
    { type: 'select', name: 'makeup_category', label: 'Category', optionsKey: 'makeupCategories' },
    { type: 'rarity', name: 'rarity' },
    { type: 'toggle', name: 'style', label: 'Style', optionsKey: 'styles' },
    { type: 'select', name: 'label', label: 'Label', optionsKey: 'labels' },
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
          ? 'Slug — edit with care, changing it breaks existing image links'
          : 'Auto-generated from makeup set (or title) and category — edit if needed',
    },
    ...(mode === 'edit'
      ? [{ type: 'imagePair', name: 'image_url', table: 'makeup_variants' } as FieldConfig]
      : []),
  ]
}
