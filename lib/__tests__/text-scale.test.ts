import { describe, expect, it } from 'vitest'
import {
  BASE_FONT_SIZE_PX,
  DEFAULT_TEXT_SCALE,
  TEXT_SCALES,
  TEXT_SCALE_FACTORS,
  TEXT_SCALE_LABELS,
  isTextScale,
  rootFontSizePx,
  textScaleFactor,
  toTextScale,
} from '../text-scale'

describe('text scale', () => {
  it('leaves the root size at the browser default when unscaled', () => {
    expect(textScaleFactor('default')).toBe(1)
    expect(rootFontSizePx('default')).toBe(BASE_FONT_SIZE_PX)
  })

  it('scales monotonically from compact to large', () => {
    const sizes = TEXT_SCALES.map(rootFontSizePx)
    expect(sizes).toEqual([...sizes].sort((a, b) => a - b))
    expect(rootFontSizePx('compact')).toBeLessThan(BASE_FONT_SIZE_PX)
    expect(rootFontSizePx('large')).toBeGreaterThan(BASE_FONT_SIZE_PX)
  })

  it('keeps every step legible', () => {
    // The M3 scale's smallest role is label/small at 0.6875rem. Below roughly
    // 11px that becomes hard to read, so the compact step must not go under it.
    const smallestRem = 0.6875
    expect(rootFontSizePx('compact') * smallestRem).toBeGreaterThanOrEqual(9.5)
  })

  it('has a label and a factor for every step', () => {
    for (const scale of TEXT_SCALES) {
      expect(TEXT_SCALE_LABELS[scale]).toBeTruthy()
      expect(typeof TEXT_SCALE_FACTORS[scale]).toBe('number')
    }
  })
})

describe('toTextScale', () => {
  it('passes through every valid step', () => {
    for (const scale of TEXT_SCALES) expect(toTextScale(scale)).toBe(scale)
  })

  it('falls back to the default for anything unrecognized', () => {
    // A stored value can predate a rename or be hand-edited; a bad row must not
    // break the theme, since this feeds the root font size.
    for (const bad of ['huge', '', null, undefined, 3, {}, []]) {
      expect(toTextScale(bad)).toBe(DEFAULT_TEXT_SCALE)
    }
  })

  it('does not treat inherited Object properties as valid', () => {
    expect(isTextScale('toString')).toBe(false)
    expect(toTextScale('constructor')).toBe(DEFAULT_TEXT_SCALE)
  })
})
