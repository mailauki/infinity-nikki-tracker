'use client'

import { FieldConfig } from '@/lib/types/form-fields'

export function trialFields(mode: 'add' | 'edit'): FieldConfig[] {
  return [
    { type: 'text', name: 'title', label: 'Title', required: true },
    {
      type: 'slug',
      name: 'slug',
      required: true,
      slugFrom: 'title',
      helperText:
        mode === 'edit'
          ? 'Used in the URL — edit with caution'
          : 'Auto-generated from name — edit if needed',
    },
    { type: 'text', name: 'realm', label: 'Realm' },
    { type: 'textarea', name: 'description', label: 'Description' },
    { type: 'select', name: 'location', label: 'Location', optionsKey: 'locations' },
    ...(mode === 'edit'
      ? [{ type: 'image', name: 'image_url', table: 'trials', size: 'xl' } as FieldConfig]
      : []),
  ]
}
