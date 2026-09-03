'use client'

import { FieldConfig } from '@/lib/types/form-fields'

// `locations` has no description column, so unlike the season lookups this form
// is title + slug + image. The image field is edit-only: ImageUpload keys its
// storage path off the slug, which does not exist until the row is saved.
export function locationFields(mode: 'add' | 'edit'): FieldConfig[] {
  return [
    { type: 'text', name: 'title', label: 'Title', required: true },
    {
      type: 'slug',
      name: 'slug',
      required: true,
      slugFrom: 'title',
      helperText: 'Auto-generated from title — edit if needed',
    },
    ...(mode === 'edit'
      ? [
          {
            type: 'image',
            name: 'image_url',
            label: 'Location Image',
            table: 'locations',
            size: 'xl',
          } as FieldConfig,
        ]
      : []),
  ]
}
