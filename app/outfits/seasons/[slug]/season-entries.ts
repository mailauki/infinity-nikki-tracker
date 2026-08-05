import { MakeupSet, MakeupVariant } from '@/lib/types/makeup'
import { OutfitSet, OutfitVariant } from '@/lib/types/outfit'
import { isEvolutionVisible, isGlowup } from '@/hooks/outfit'
import { OutfitSetListEntry } from './outfit-set-item'

// The container set that holds individually-authored standalone pieces. Its
// variants each carry their own season / season_category, so they are grouped
// per-variant rather than by the container's (null) season.
export const STANDALONE_SLUG = 'standalone_pieces'

// Sets without a season_category group here, matching the outfit-set behavior.
export const OTHER_CATEGORY = 'Other'

// A single row in a category accordion. Outfit sets keep the existing shape
// (base set or one evolution); standalone pieces and makeup add two more kinds
// so one list can render all three.
export type SeasonEntry =
  | ({ kind: 'outfit' } & OutfitSetListEntry)
  | {
      kind: 'standalone'
      key: string
      variant: OutfitVariant
    }
  | {
      kind: 'makeup'
      key: string
      set: MakeupSet
      evolution: MakeupSet | null
      variants: MakeupVariant[]
    }

/** Every variant a row counts toward its progress chip, regardless of kind. */
export function entryVariants(entry: SeasonEntry): { obtained?: boolean }[] {
  if (entry.kind === 'standalone') return [entry.variant]
  return entry.variants
}

export function countEntries(entries: SeasonEntry[]) {
  const variants = entries.flatMap(entryVariants)
  return {
    total: variants.length,
    obtained: variants.reduce((sum, variant) => sum + (variant.obtained ? 1 : 0), 0),
  }
}

// Expand a set into its base entry plus one entry per evolution (including the
// glow-up). Each entry is rendered as its own list item — the same model as the
// outfits grid, where evolutions and glow-ups stand alongside base sets — and is
// shown or hidden by the evolution / glow-up toggles. The base entry is always
// shown; progress is measured against each entry's own variants.
export function expandSet(
  set: OutfitSet,
  hideEvolutions: boolean,
  hideGlowups: boolean
): OutfitSetListEntry[] {
  const baseSlug = set.slug

  const entries: OutfitSetListEntry[] = [
    {
      key: baseSlug,
      set,
      evolution: null,
      variants: set.outfit_variants.filter((v) => v.outfit_set === baseSlug),
    },
  ]

  for (const evolution of set.evolutions) {
    const visible = isEvolutionVisible({
      stateSlug: evolution.slug,
      baseSlug,
      isGlowupState: isGlowup(evolution),
      hideEvolutions,
      hideGlowups,
    })
    if (!visible) continue

    const variants = set.outfit_variants.filter((v) => v.outfit_set === evolution.slug)
    if (variants.length === 0) continue

    entries.push({
      key: evolution.slug,
      set,
      evolution,
      variants,
      isGlowup: isGlowup(evolution),
    })
  }

  return entries
}

// Makeup mirrors the outfit model — a base set plus one row per evolution — but
// has no glow-up concept, so only the evolution toggle applies.
function expandMakeupSet(set: MakeupSet, hideEvolutions: boolean): SeasonEntry[] {
  const entries: SeasonEntry[] = [
    {
      kind: 'makeup',
      key: `makeup:${set.slug}`,
      set,
      evolution: null,
      variants: set.makeup_variants,
    },
  ]

  if (hideEvolutions) return entries

  for (const evolution of set.evolutions) {
    if (evolution.makeup_variants.length === 0) continue
    entries.push({
      kind: 'makeup',
      key: `makeup:${evolution.slug}`,
      set,
      evolution,
      variants: evolution.makeup_variants,
    })
  }

  return entries
}

/**
 * Group every row of a season into its season_category bucket.
 *
 * The three sources key off different columns: outfit sets and makeup sets carry
 * `season_category` on the set, while standalone pieces carry it per-variant
 * (the container set itself has no season). Rows without a category fall under
 * "Other".
 */
export function groupSeasonEntries({
  seasonSets,
  standaloneVariants,
  makeupSets,
  hideEvolutions,
  hideGlowups,
}: {
  seasonSets: OutfitSet[]
  standaloneVariants: OutfitVariant[]
  makeupSets: MakeupSet[]
  hideEvolutions: boolean
  hideGlowups: boolean
}): [string, SeasonEntry[]][] {
  const groups = new Map<string, SeasonEntry[]>()

  const push = (category: string | null, entries: SeasonEntry[]) => {
    if (entries.length === 0) return
    const key = category ?? OTHER_CATEGORY
    const bucket = groups.get(key)
    if (bucket) bucket.push(...entries)
    else groups.set(key, entries)
  }

  for (const set of seasonSets) {
    push(
      set.season_category,
      expandSet(set, hideEvolutions, hideGlowups).map((entry) => ({
        kind: 'outfit' as const,
        ...entry,
      }))
    )
  }

  for (const variant of standaloneVariants) {
    push(variant.season_category, [
      { kind: 'standalone', key: `standalone:${variant.slug}`, variant },
    ])
  }

  for (const set of makeupSets) {
    push(set.season_category, expandMakeupSet(set, hideEvolutions))
  }

  return [...groups.entries()]
}
