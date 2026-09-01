import { MakeupSet, MakeupVariant } from '@/lib/types/makeup'
import { Evolution, ObtainedOutfit, OutfitSet, OutfitVariant } from '@/lib/types/outfit'
import { isEvolutionVisible, isGlowup } from '@/hooks/outfit'

// The container set that holds individually-authored standalone pieces. Its
// variants each carry their own season / season_category, so they are grouped
// per-variant rather than by the container's (null) season.
export const STANDALONE_SLUG = 'standalone_pieces'

// Sets without a season_category group here, matching the outfit-set behavior.
export const OTHER_CATEGORY = 'Other'

// One outfit card: either the base set (evolution === null) or one of its
// evolutions / glow-up. `variants` are that state's own variants, so each card
// shows its own completion.
export type OutfitSetListEntry = {
  key: string
  set: OutfitSet
  evolution: Evolution | null
  variants: OutfitVariant[]
  isGlowup?: boolean
}

// A single card in a category section. Outfit sets keep the existing shape
// (base set or one evolution); standalone pieces and makeup add two more kinds
// so one section can render all three.
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

/** How many cards of each kind a season holds — drives the overview stat row. */
export function countEntryKinds(entries: SeasonEntry[]) {
  return {
    outfit: entries.filter((e) => e.kind === 'outfit').length,
    standalone: entries.filter((e) => e.kind === 'standalone').length,
    makeup: entries.filter((e) => e.kind === 'makeup').length,
  }
}

/**
 * Re-derive `obtained` from the provider's live obtained rows.
 *
 * The season page fetches its sets server-side, so their `obtained` flags are a
 * snapshot from render time. The provider holds the live set (kept current by
 * its realtime subscription), so without this a toggle would update provider
 * state while these props stayed stale and the card would never visibly change.
 * Mirrors `app/outfits/[slug]/outfit-set-detail.tsx`.
 */
export function applyLiveObtained<T extends { slug: string; obtained?: boolean }>(
  variants: T[],
  obtainedOutfit: ObtainedOutfit[]
): T[] {
  const keys = new Set(obtainedOutfit.map((o) => o.outfit_variant))
  return variants.map((variant) => ({ ...variant, obtained: keys.has(variant.slug) }))
}

// Expand a set into its base entry plus one entry per evolution (including the
// glow-up). Each entry is rendered as its own card — the same model as the
// outfits grid, where evolutions and glow-ups stand alongside base sets — and is
// shown or hidden by the visibility toggles. Progress is measured against each
// entry's own variants.
export function expandSet(
  set: OutfitSet,
  hideEvolutions: boolean,
  hideGlowups: boolean,
  hideBaseSets = false
): OutfitSetListEntry[] {
  const baseSlug = set.slug

  const entries: OutfitSetListEntry[] = hideBaseSets
    ? []
    : [
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
// has no glow-up concept, so only the evolution and base-set toggles apply.
function expandMakeupSet(
  set: MakeupSet,
  hideEvolutions: boolean,
  hideBaseSets = false
): SeasonEntry[] {
  const entries: SeasonEntry[] = hideBaseSets
    ? []
    : [
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
  hidePieces = false,
  hideMakeup = false,
  hideBaseSets = false,
  obtainedOutfit,
}: {
  seasonSets: OutfitSet[]
  standaloneVariants: OutfitVariant[]
  makeupSets: MakeupSet[]
  hideEvolutions: boolean
  hideGlowups: boolean
  // Drops the base state of every set (outfit and makeup), leaving only
  // evolutions and glow-ups.
  hideBaseSets?: boolean
  // Drops standalone pieces (individual variants). Makeup sets are unaffected —
  // they are sets with their own variants, not individual pieces.
  hidePieces?: boolean
  // Drops makeup sets and their evolutions.
  hideMakeup?: boolean
  // Live obtained rows from the outfit provider. Omit to trust the flags already
  // on the passed-in data (e.g. server-rendered output with no provider).
  obtainedOutfit?: ObtainedOutfit[]
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
    // Refresh the set's variants before expanding so every card, category bar,
    // and total downstream reads the same live obtained state.
    const live = obtainedOutfit
      ? { ...set, outfit_variants: applyLiveObtained(set.outfit_variants, obtainedOutfit) }
      : set

    push(
      set.season_category,
      expandSet(live, hideEvolutions, hideGlowups, hideBaseSets).map((entry) => ({
        kind: 'outfit' as const,
        ...entry,
      }))
    )
  }

  const liveStandalone = obtainedOutfit
    ? applyLiveObtained(standaloneVariants, obtainedOutfit)
    : standaloneVariants

  if (!hidePieces) {
    for (const variant of liveStandalone) {
      push(variant.season_category, [
        { kind: 'standalone', key: `standalone:${variant.slug}`, variant },
      ])
    }
  }

  if (!hideMakeup) {
    for (const set of makeupSets) {
      push(set.season_category, expandMakeupSet(set, hideEvolutions, hideBaseSets))
    }
  }

  return [...groups.entries()]
}
