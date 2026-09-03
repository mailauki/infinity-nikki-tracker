'use client'

import { FieldConfig } from '@/lib/types/form-fields'

export function seasonFields(mode: 'add' | 'edit'): FieldConfig[] {
  return [
    { type: 'text', name: 'title', label: 'Title', required: true },
    {
      type: 'slug',
      name: 'slug',
      required: true,
      slugFrom: 'title',
      helperText:
        mode === 'edit'
          ? 'Edit with caution — changing the slug will break any outfit sets referencing this season'
          : 'Auto-generated from title — edit if needed',
    },
    { type: 'select', name: 'location', label: 'Location', optionsKey: 'locations' },
    {
      type: 'switch',
      name: 'use_season_groups',
      label: 'Group categories on the seasons index',
      helperText:
        "Lists this season's card by season group instead of category — worth it for a season with a long category list. Categories with no group stay their own rows either way, and the season page is unaffected.",
    },
    {
      type: 'textarea',
      name: 'description',
      label: 'Description',
      helperText: mode === 'add' ? 'Image can be added after saving' : undefined,
    },
    ...(mode === 'edit'
      ? [
          {
            type: 'image',
            name: 'image_url',
            label: 'Default',
            table: 'seasons',
            size: 'xl',
          } as FieldConfig,
          {
            type: 'image',
            name: 'alt_image_url',
            label: 'Alternative',
            table: 'seasons',
            column: 'alt_image_url',
            size: 'xl',
          } as FieldConfig,
        ]
      : []),
  ]
}
