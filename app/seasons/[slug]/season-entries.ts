import { MakeupSet, MakeupVariant, ObtainedMakeup } from '@/lib/types/makeup'
import {
  Evolution,
  ObtainedOutfit,
  OutfitSet,
  OutfitVariant,
  SeasonCategory,
  SeasonGroup,
} from '@/lib/types/outfit'
import { isEvolutionVisible, isGlowup } from '@/hooks/outfit'
import { isStandaloneMakeupSet } from '@/hooks/makeup'
import type { SortAxis, SortDir } from '@/components/sort-context'

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

// A single card in a category section. Outfit sets keep the existing shape (base
// set or one evolution); outfit and makeup pieces add a kind each, so one
// section can render all three.
export type SeasonEntry =
  | ({ kind: 'outfit' } & OutfitSetListEntry)
  | {
      kind: 'standalone'
      key: string
      variant: OutfitVariant
    }
  // A makeup piece. Both individually-authored pieces and the members of a
  // makeup set land here: a set is five separate wearables (base makeup,
  // contact lenses, eyebrows, eyelashes, lips), so a season lists and counts
  // them as pieces rather than as a single set card.
  | {
      kind: 'makeup-standalone'
      key: string
      variant: MakeupVariant
    }

/** Every variant a row counts toward its progress chip, regardless of kind. */
export function entryVariants(entry: SeasonEntry): { obtained?: boolean }[] {
  if (entry.kind === 'standalone' || entry.kind === 'makeup-standalone') return [entry.variant]
  return entry.variants
}

export function countEntries(entries: SeasonEntry[]) {
  const variants = entries.flatMap(entryVariants)
  return {
    total: variants.length,
    obtained: variants.reduce((sum, variant) => sum + (variant.obtained ? 1 : 0), 0),
  }
}

/**
 * A card counts as obtained once every variant it shows is collected — the same
 * rule ProgressChip uses to render its complete state, so a row's composition
 * chip and its card's chip can never disagree. An entry with no variants is not
 * complete: nothing was collected, so counting it as obtained would inflate the
 * total.
 */
export function isEntryObtained(entry: SeasonEntry) {
  const variants = entryVariants(entry)
  return variants.length > 0 && variants.every((variant) => variant.obtained)
}

/**
 * Progress measured in CARDS rather than variants — the denominator the
 * composition chips report, so "8 outfits + 50 pieces" totals 58 and not the
 * 126 variants those 58 cards contain between them.
 *
 * A piece is one card and one variant either way; the difference is an outfit
 * set, which is a single card holding ten-odd variants. Use countEntries for a
 * single card's own progress (its variants are exactly what that card shows).
 */
/**
 * Sort the cards WITHIN each category, honouring the toolbar's sort axis and
 * direction. Category sections keep their own order — only their contents move.
 *
 * Mirrors the outfits grid's comparator so the two pages agree on what each axis
 * means: `desc` is newest / highest / most-complete first for date, rarity and
 * progress, while `title` reads A-Z under `asc`. Ties break on id so the order is
 * stable across renders.
 *
 * An entry's sortable fields come from the row it represents — a set card sorts
 * on its set, a piece on its variant — so the three kinds interleave sensibly
 * rather than clustering by kind.
 */
export function sortSeasonEntries(
  groups: [string, SeasonEntry[]][],
  sortAxis: SortAxis,
  sortDir: SortDir
): [string, SeasonEntry[]][] {
  const row = (entry: SeasonEntry) =>
    entry.kind === 'standalone' || entry.kind === 'makeup-standalone'
      ? entry.variant
      : (entry.evolution ?? entry.set)

  const progress = (entry: SeasonEntry) => {
    const variants = entryVariants(entry)
    if (variants.length === 0) return 0
    return variants.filter((v) => v.obtained).length / variants.length
  }

  const compare = (a: SeasonEntry, b: SeasonEntry) => {
    const ra = row(a) as { id?: number | null; rarity?: number | null; title?: string | null }
    const rb = row(b) as { id?: number | null; rarity?: number | null; title?: string | null }
    let cmp = 0
    switch (sortAxis) {
      case 'rarity':
        cmp = (ra.rarity ?? 0) - (rb.rarity ?? 0)
        break
      case 'progress':
        cmp = progress(a) - progress(b)
        break
      case 'title':
        cmp = (ra.title ?? '').localeCompare(rb.title ?? '')
        break
      default:
        cmp = (ra.id ?? 0) - (rb.id ?? 0)
    }
    return (sortDir === 'asc' ? cmp : -cmp) || (ra.id ?? 0) - (rb.id ?? 0)
  }

  return groups.map(([category, entries]) => [category, [...entries].sort(compare)])
}

/**
 * A run of category sections that share a season_group, in the order the
 * categories already came in. `group` is null for ungrouped categories, which
 * render exactly as they did before groups existed — no heading, no wrapper.
 */
export type SeasonCategorySection = {
  group: SeasonGroup | null
  categories: [string, SeasonEntry[]][]
}

/**
 * Fold the category list into season_group runs for display.
 *
 * Deliberately takes the ALREADY filtered and sorted groups rather than doing
 * its own grouping pass: the grid and the contents sidebar each build that list
 * from the same groupSeasonEntries + applySeasonFilters call, so folding at the
 * end keeps them in lockstep and means a category emptied by a filter takes its
 * heading with it.
 *
 * Whether a season groups at all is derived here, not stored: a season shows
 * headings iff some category in it has a season_group. That is why there is no
 * `uses_groups` flag on `seasons` — a stored flag would be a second source of
 * truth that could contradict the categories themselves.
 *
 * ALL of a group's categories gather into one section, anchored at the position
 * of its first member — a group names a real grouping, so every member belongs
 * under one heading however the categories arrived. They routinely arrive
 * interleaved: categories reach here in data insertion order, since nothing
 * sorts the category list (sortSeasonEntries reorders only the entries WITHIN
 * each category). Merging by adjacency instead rendered one heading per run, so
 * Shooting Star Season showed "Journey Momentos" three separate times.
 *
 * Anchoring at the first member is what keeps gathering from reshuffling the
 * page: sections still read in the order their groups first appeared.
 *
 * Ungrouped categories are the exception — they merge only when ADJACENT. They
 * share no group to be gathered by, so pooling them would yank every stray
 * category in the season into a single block wherever the first one happened to
 * sit.
 */
export function groupCategoriesBySeasonGroup(
  categories: [string, SeasonEntry[]][],
  seasonCategories: SeasonCategory[],
  seasonGroups: SeasonGroup[]
): SeasonCategorySection[] {
  const groupBySlug = new Map(seasonGroups.map((group) => [group.slug, group]))
  const groupForCategory = new Map(
    seasonCategories.map((category) => [category.slug, category.season_group])
  )

  const sections: SeasonCategorySection[] = []
  // Where each group opened its section, so later members join it rather than
  // starting a duplicate.
  const sectionForGroup = new Map<string, SeasonCategorySection>()

  for (const entry of categories) {
    const [categorySlug] = entry
    // OTHER_CATEGORY is a synthetic bucket for rows with no category at all, so
    // it has no row in season_categories and never carries a group.
    const groupSlug = groupForCategory.get(categorySlug) ?? null
    // An unresolvable slug (a group deleted between render and read) falls back
    // to ungrouped rather than rendering a heading with no title.
    const group = groupSlug ? (groupBySlug.get(groupSlug) ?? null) : null

    if (group) {
      const existing = sectionForGroup.get(group.slug)
      if (existing) {
        existing.categories.push(entry)
        continue
      }
      const section: SeasonCategorySection = { group, categories: [entry] }
      sectionForGroup.set(group.slug, section)
      sections.push(section)
      continue
    }

    const previous = sections.at(-1)
    if (previous && previous.group === null) previous.categories.push(entry)
    else sections.push({ group: null, categories: [entry] })
  }

  return sections
}

export function countEntryCards(entries: SeasonEntry[]) {
  return {
    total: entries.length,
    obtained: entries.filter(isEntryObtained).length,
  }
}

/**
 * How many cards of each kind a season holds, and how many of those are fully
 * collected — drives the overview stat row and the category composition chips.
 */
export function countEntryKinds(entries: SeasonEntry[]) {
  const of = (kind: SeasonEntry['kind']) => entries.filter((e) => e.kind === kind)
  const counts = (kind: SeasonEntry['kind']) => {
    const kindEntries = of(kind)
    return {
      total: kindEntries.length,
      obtained: kindEntries.filter(isEntryObtained).length,
    }
  }

  const outfit = counts('outfit')
  const outfitPiece = counts('standalone')
  const makeupPiece = counts('makeup-standalone')

  return {
    // Outfit-set cards (base states, evolutions, glow-ups).
    outfit: outfit.total,
    // Every individual wearable — standalone outfit variants plus makeup, whether
    // individually authored or a member of a makeup set — counts as a piece.
    standalone: outfitPiece.total + makeupPiece.total,
    obtained: {
      outfit: outfit.obtained,
      standalone: outfitPiece.obtained + makeupPiece.obtained,
    },
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

/**
 * The makeup counterpart of applyLiveObtained — same reasoning, but obtained
 * rows key off `makeup_variant` rather than `outfit_variant`, so the two cannot
 * share one implementation.
 */
export function applyLiveObtainedMakeup<T extends { slug: string; obtained?: boolean }>(
  variants: T[],
  obtainedMakeup: ObtainedMakeup[]
): T[] {
  const keys = new Set(obtainedMakeup.map((o) => o.makeup_variant))
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
//
// Each state is expanded into one entry PER VARIANT rather than a single card
// for the whole set. A makeup set is five separate wearables (base makeup,
// contact lenses, eyebrows, eyelashes, lips), and a season lists what you can
// collect — so they are shown and counted the same way standalone makeup pieces
// are, as five pieces rather than one set.
//
// `set.makeup_variants` on a base row also carries every evolution's variants
// (see createMakeupSet), so each state is filtered to its own `makeup_set` slug.
// Without that the base state would re-emit its evolutions' pieces and every
// count would run high.
function expandMakeupSet(
  set: MakeupSet,
  hideEvolutions: boolean,
  hideBaseSets = false
): SeasonEntry[] {
  const asPieces = (stateSlug: string, variants: MakeupVariant[]): SeasonEntry[] =>
    variants
      .filter((variant) => variant.makeup_set === stateSlug)
      .map((variant) => ({
        kind: 'makeup-standalone' as const,
        key: `makeup-piece:${variant.slug}`,
        variant,
      }))

  const entries: SeasonEntry[] = hideBaseSets ? [] : asPieces(set.slug, set.makeup_variants)

  if (hideEvolutions) return entries

  for (const evolution of set.evolutions) {
    entries.push(...asPieces(evolution.slug, evolution.makeup_variants))
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
  seasonSlug,
  hideEvolutions,
  hideGlowups,
  hidePieces = false,
  hideMakeup = false,
  hideBaseSets = false,
  obtainedOutfit,
  obtainedMakeup,
}: {
  seasonSets: OutfitSet[]
  standaloneVariants: OutfitVariant[]
  makeupSets: MakeupSet[]
  // Which season is being grouped. Standalone makeup pieces are matched against
  // it per-variant; omit it to skip them entirely (the seasons index, which
  // counts sets rather than expanding a single season).
  seasonSlug?: string
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
  // The provider's live obtained makeup rows. Same purpose as obtainedOutfit:
  // makeup sets arrive as server-rendered props whose `obtained` flags are a
  // render-time snapshot, so without this a toggle updates provider state while
  // these stay stale and the card never repaints.
  obtainedMakeup?: ObtainedMakeup[]
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

  const liveMakeupVariants = <T extends { slug: string; obtained?: boolean }>(variants: T[]) =>
    obtainedMakeup ? applyLiveObtainedMakeup(variants, obtainedMakeup) : variants

  if (!hideMakeup) {
    for (const set of makeupSets) {
      // The standalone-makeup container has no season of its own — each of its
      // variants carries one — so it is grouped per-variant below rather than
      // expanded as a set. Expanding it here would file every piece in the
      // season under one card in the "Other" bucket.
      if (isStandaloneMakeupSet(set)) continue
      // Refresh before expanding, so every piece card and every count below
      // reads the same live state.
      const live = {
        ...set,
        makeup_variants: liveMakeupVariants(set.makeup_variants),
        evolutions: set.evolutions.map((evolution) => ({
          ...evolution,
          makeup_variants: liveMakeupVariants(evolution.makeup_variants),
        })),
      }
      push(set.season_category, expandMakeupSet(live, hideEvolutions, hideBaseSets))
    }
  }

  // Standalone makeup pieces, matched to this season the same way standalone
  // outfit variants are: on the variant's own columns. Gated on `hidePieces`
  // rather than `hideMakeup` — they are individual pieces, and the pieces
  // toggle is what a reader expects to control them.
  //
  // `makeupSets` is already scoped to this season by the caller, but the
  // container set is not (it has no season), so it survives that filter with
  // every piece in the game inside it. Re-filter per variant here.
  const standaloneMakeupVariants = seasonSlug
    ? liveMakeupVariants(
        (makeupSets.find(isStandaloneMakeupSet)?.makeup_variants ?? []).filter(
          (variant) => variant.seasons === seasonSlug
        )
      )
    : []

  if (!hidePieces) {
    for (const variant of standaloneMakeupVariants) {
      push(variant.season_category, [
        { kind: 'makeup-standalone', key: `makeup-piece:${variant.slug}`, variant },
      ])
    }
  }

  return [...groups.entries()]
}

/** The season page's non-visibility filter axes. Null / empty means "no filter". */
export type SeasonFilters = {
  obtained: 'obtained' | 'missing' | null
  rarity: number | null
  styles: string[]
}

/**
 * Apply the obtained / rarity / style axes to already-grouped entries.
 *
 * These select WITHIN a kind, unlike the hide-flags which gate whole kinds, so
 * they run over the grouped output rather than being threaded into the expansion
 * functions — one predicate then covers outfit sets, outfit pieces and makeup
 * pieces uniformly, and every count downstream follows because those counts
 * already derive from this same entry list.
 *
 * An outfit set card matches on rarity/style if ANY variant it shows does: the
 * card is one row, and hiding it because one of its ten variants disagrees would
 * misrepresent what the set contains.
 */
export function applySeasonFilters(
  groups: [string, SeasonEntry[]][],
  filters: SeasonFilters
): [string, SeasonEntry[]][] {
  const { obtained, rarity, styles } = filters
  if (!obtained && rarity === null && styles.length === 0) return groups

  const matches = (entry: SeasonEntry) => {
    const variants = entryVariants(entry) as Array<{
      obtained?: boolean
      rarity?: number | null
      style?: string | null
    }>
    if (variants.length === 0) return false

    if (obtained === 'obtained' && !variants.every((v) => v.obtained)) return false
    if (obtained === 'missing' && variants.every((v) => v.obtained)) return false
    if (rarity !== null && !variants.some((v) => v.rarity === rarity)) return false
    if (styles.length > 0 && !variants.some((v) => v.style && styles.includes(v.style)))
      return false
    return true
  }

  return groups
    .map(([category, entries]) => [category, entries.filter(matches)] as [string, SeasonEntry[]])
    .filter(([, entries]) => entries.length > 0)
}
