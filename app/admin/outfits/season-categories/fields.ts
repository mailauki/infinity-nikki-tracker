import { FieldConfig } from '@/lib/types/form-fields'

export function seasonCategoryFields(mode: 'add' | 'edit'): FieldConfig[] {
  return [
    { type: 'text', name: 'title', label: 'Title', required: true },
    {
      type: 'slug',
      name: 'slug',
      required: true,
      slugFrom: 'title',
      helperText: 'Auto-generated from title — edit if needed',
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
            label: 'Season Category Image',
            table: 'season_categories',
            size: 'xl',
          } as FieldConfig,
        ]
      : []),
  ]
}
