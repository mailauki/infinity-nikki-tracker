'use client'

import { FieldConfig, FieldOption, FieldValues } from '@/lib/types/form-fields'
import { toSlugVariant } from '@/lib/utils'
import { EurekaVariantRaw } from '@/lib/types/eureka'

const iridescentLast = (a: FieldOption, b: FieldOption) => {
  if (a.slug === 'iridescent') return 1
  if (b.slug === 'iridescent') return -1
  return 0
}

export function eurekaVariantFields(
  mode: 'add' | 'edit',
  variants: EurekaVariantRaw[],
  currentId?: number
): FieldConfig[] {
  const hasDefault = (v: FieldValues) =>
    variants.some(
      (x) =>
        x.id !== currentId &&
        x.eureka_set === v.eureka_set &&
        x.category === v.category &&
        x.default
    )

  return [
    {
      type: 'select',
      name: 'eureka_set',
      label: 'Eureka Set',
      optionsKey: 'eurekaSets',
      required: true,
    },
    { type: 'select', name: 'category', label: 'Category', optionsKey: 'categories' },
    {
      type: 'select',
      name: 'color',
      label: 'Color',
      optionsKey: 'colors',
      sortOptions: iridescentLast,
    },
    {
      type: 'slug',
      name: 'slug',
      required: true,
      // eureka variants track their slug live in edit mode too (the original
      // form re-derived on set/category/color change).
      deriveOnEdit: true,
      // Only regenerate once all three parts are present; otherwise keep the
      // current slug (matches the original form, which never cleared it).
      slugFrom: (v) =>
        v.eureka_set && v.category && v.color
          ? toSlugVariant(String(v.eureka_set), String(v.category), String(v.color))
          : String(v.slug ?? ''),
      helperText: 'Auto-generated from name, category, and color — edit if needed',
    },
    ...(mode === 'edit'
      ? [{ type: 'image', name: 'image_url', table: 'eureka_variants' } as FieldConfig]
      : []),
    {
      type: 'switch',
      name: 'default',
      label: 'Default variant',
      disabled: hasDefault,
      helperText: (v) =>
        hasDefault(v)
          ? 'This category already has a default variant for this set'
          : 'Used to determine the Eureka set thumbnail image — limit one per category',
    },
  ]
}
