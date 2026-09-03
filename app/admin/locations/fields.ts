'use client'

import { FieldConfig } from '@/lib/types/form-fields'

// `locations` is a thin lookup table — id, slug, title, created_at. There is no
// image_url or description column, so unlike the season lookups this form is
// title + slug only.
export function locationFields(): FieldConfig[] {
  return [
    { type: 'text', name: 'title', label: 'Title', required: true },
    {
      type: 'slug',
      name: 'slug',
      required: true,
      slugFrom: 'title',
      helperText: 'Auto-generated from title — edit if needed',
    },
  ]
}
