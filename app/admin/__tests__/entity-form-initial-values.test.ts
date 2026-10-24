import { describe, expect, it } from 'vitest'
import { buildInitialValues } from '@/app/admin/entity-form'
import { outfitVariantFields } from '@/app/admin/outfits/variants/fields'

describe('buildInitialValues', () => {
  it('keeps label_2, which the labelPair field owns without a field of its own', () => {
    const values = buildInitialValues(outfitVariantFields('edit'), {
      label: 'elegant',
      label_2: 'fresh',
    })
    expect(values.label).toBe('elegant')
    expect(values.label_2).toBe('fresh')
  })
})
