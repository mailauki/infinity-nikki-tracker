import { describe, expect, it } from 'vitest'
import { variantsToToggle } from '../eureka'
import type { EurekaVariant } from '@/lib/types/eureka'

const v = (i: number, obtained: boolean) =>
  ({ eureka_set: 's', category: 'c', color: `k${i}`, obtained }) as unknown as EurekaVariant

describe('variantsToToggle', () => {
  it('partly obtained: sends only the missing variants, target true', () => {
    const r = variantsToToggle([v(1, true), v(2, false), v(3, false)])
    expect(r.target).toBe(true)
    expect(r.variants.map((x) => x.color)).toEqual(['k2', 'k3'])
  })

  it('fully obtained: sends all variants, target false', () => {
    const r = variantsToToggle([v(1, true), v(2, true)])
    expect(r.target).toBe(false)
    expect(r.variants).toHaveLength(2)
  })

  it('empty: nothing to send', () => {
    expect(variantsToToggle([]).variants).toEqual([])
  })
})
