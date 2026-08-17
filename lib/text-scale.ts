// Comfort text scaling. Multiplies the whole M3 type scale so the app can be
// read at a larger size — this is the app-wide counterpart to browser reader
// mode, which only ever applies to the two prose routes.
//
// No imports and no JSX on purpose: this is read by the theme (client), the
// preference defaults (shared), and the root layout's inline script (a raw
// string), so it must stay plain data.

export type TextScale = 'compact' | 'default' | 'comfortable' | 'large'

// Every fontSize in lib/theme.ts's M3_TYPE_SCALE is expressed in rem, so
// scaling the root font size scales the entire ladder — and any rem-based
// spacing with it — without restating 15 entries per step. 16px is the browser
// default and what `1rem` means unscaled.
export const BASE_FONT_SIZE_PX = 16

export const TEXT_SCALE_FACTORS: Record<TextScale, number> = {
  compact: 0.9,
  default: 1,
  comfortable: 1.125,
  large: 1.25,
}

export const TEXT_SCALES = ['compact', 'default', 'comfortable', 'large'] as const

export const TEXT_SCALE_LABELS: Record<TextScale, string> = {
  compact: 'Compact',
  default: 'Default',
  comfortable: 'Comfortable',
  large: 'Large',
}

export const DEFAULT_TEXT_SCALE: TextScale = 'default'

export function isTextScale(value: unknown): value is TextScale {
  // Own-property check, not `in`: `in` walks the prototype chain, so 'toString'
  // and 'constructor' would validate and then resolve to a non-number factor —
  // yielding NaN as the root font size.
  return (
    typeof value === 'string' && Object.prototype.hasOwnProperty.call(TEXT_SCALE_FACTORS, value)
  )
}

/** Normalizes an unknown stored value, so a bad row can't break the theme. */
export function toTextScale(value: unknown): TextScale {
  return isTextScale(value) ? value : DEFAULT_TEXT_SCALE
}

export function textScaleFactor(scale: TextScale): number {
  return TEXT_SCALE_FACTORS[scale]
}

/** The root font size in px for a given step. */
export function rootFontSizePx(scale: TextScale): number {
  return BASE_FONT_SIZE_PX * textScaleFactor(scale)
}

// Key for the pre-hydration script's localStorage mirror. The preference is
// owned by the database, but the root font size has to be applied before first
// paint or text visibly jumps on every load; localStorage is the only store
// readable that early.
export const TEXT_SCALE_STORAGE_KEY = 'text-scale'
