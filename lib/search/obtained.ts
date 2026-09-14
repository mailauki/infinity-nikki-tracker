import type { SearchResult } from './types'

export type ObtainedAction =
  | { fn: 'outfit'; args: [outfit_set: string, outfit_category: string, outfit_variant: string] }
  | { fn: 'eureka'; args: [eureka_set: string, category: string, color: string] }
  | { fn: 'makeup'; args: [makeup_set: string, makeup_category: string, makeup_variant: string] }
  | { fn: 'momoCloak'; args: [momo_cloak: string] }

// Only these four kinds have collection state. Everything else renders no
// toggle at all rather than a disabled one.
export function isCollectible(result: SearchResult): boolean {
  return actionFor(result) !== null
}

export function actionFor(result: SearchResult): ObtainedAction | null {
  const { kind, slug, parent_slug, subtitle, filter_value } = result

  switch (kind) {
    case 'outfit_piece':
      if (!parent_slug) return null
      return { fn: 'outfit', args: [parent_slug, subtitle ?? '', slug] }
    // Keys on the bare color, not the slug -- the slug is
    // `{set}-{category}-{color}` and obtained_eureka.color holds only the color.
    case 'eureka_variant':
      if (!parent_slug || !filter_value) return null
      return { fn: 'eureka', args: [parent_slug, subtitle ?? '', filter_value] }
    case 'makeup_variant':
      if (!parent_slug) return null
      return { fn: 'makeup', args: [parent_slug, subtitle ?? '', slug] }
    case 'momo_cloak':
      return { fn: 'momoCloak', args: [slug] }
    default:
      return null
  }
}
