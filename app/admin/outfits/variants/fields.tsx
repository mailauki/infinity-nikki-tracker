'use client'

import { FieldConfig, FieldValues } from '@/lib/types/form-fields'
import { toSlug } from '@/lib/utils'

function deriveSlug(v: FieldValues): string {
  const category = String(v.outfit_category ?? '')
  if (v.outfit_set) {
    return [String(v.outfit_set), category].filter(Boolean).join('-')
  }
  return [toSlug(String(v.title ?? '')), category].filter(Boolean).join('-')
}

export function outfitVariantFields(mode: 'add' | 'edit'): FieldConfig[] {
  return [
    {
      type: 'custom',
      name: 'outfit_set',
      component: 'groupedOutfitSet',
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
    { type: 'text', name: 'title', label: 'Title', required: (v) => !v.outfit_set },
    { type: 'textarea', name: 'description', label: 'Description' },
    {
      type: 'slug',
      name: 'slug',
      required: true,
      slugFrom: deriveSlug,
      helperText:
        mode === 'edit'
          ? 'Slug — edit with care, changing it breaks existing image links'
          : 'Auto-generated from outfit set (or title) and category — edit if needed',
    },
    ...(mode === 'edit'
      ? [{ type: 'imagePair', name: 'image_url', table: 'outfit_variants' } as FieldConfig]
      : []),
    { type: 'switch', name: 'default', label: 'Default variant' },
  ]
}
