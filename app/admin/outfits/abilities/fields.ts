import { FieldConfig } from '@/lib/types/form-fields'

export function abilityFields(mode: 'add' | 'edit'): FieldConfig[] {
  return [
    { type: 'text', name: 'title', label: 'Title', required: true },
    {
      type: 'slug',
      name: 'slug',
      required: true,
      slugFrom: 'title',
      helperText:
        mode === 'edit'
          ? 'Edit with caution — changing the slug will break any outfit sets referencing this ability'
          : 'Auto-generated from title — edit if needed',
    },
    ...(mode === 'edit'
      ? [
          {
            type: 'image',
            name: 'image_url',
            label: 'Image',
            table: 'abilities',
            caption: 'Ability Image',
          } as FieldConfig,
        ]
      : []),
  ]
}
