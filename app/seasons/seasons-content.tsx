'use client'

import {
  Box,
  ListItem,
  ListItemText,
  ListSubheader,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'

import { useOutfitData } from '@/components/outfits/outfit-context'
import { useMakeupData } from '@/components/makeup/makeup-context'
import { useOutfitImageMode } from '@/components/outfits/outfit-image-mode-context'
import { useSortOrder } from '@/components/sort-context'
import { useSeasonFilter } from './[slug]/season-filter-context'
import { MakeupSet } from '@/lib/types/makeup'
import { Location, Season, SeasonCategory, SeasonGroup } from '@/lib/types/outfit'
import { isStandaloneMakeupSet } from '@/hooks/makeup'
import {
  countCountableEntries,
  countEntryCards,
  groupSeasonEntries,
  OTHER_CATEGORY,
  SeasonEntry,
  STANDALONE_SLUG,
} from '@/app/seasons/[slug]/season-entries'
import SeasonCard from './season-card'

// Mirrors the row skeleton in ./loading.tsx so a card's rows keep the same shape
// from route-level fallback through to loaded data.
function CategoryRowSkeleton() {
  return (
    <ListItem
      disableGutters
      secondaryAction={
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Skeleton height={16} variant="text" width={24} />
        </Stack>
      }
    >
      <ListItemText primary={<Skeleton height={20} variant="text" width="50%" />} />
    </ListItem>
  )
}

// One row of a season card: a season group where the season uses groups, a bare
// category where it does not.
export type SeasonRow = {
  key: string
  title: string
  obtained: number
  total: number
}

export default function SeasonsContent({
  seasons,
  seasonCategories,
  seasonGroups,
  locations,
  makeupSets,
}: {
  seasons: Season[]
  seasonCategories: SeasonCategory[]
  seasonGroups: SeasonGroup[]
  locations: Location[]
  makeupSets: MakeupSet[]
}) {
  const { outfitSets, obtainedOutfit, isLoggedIn, isLoading, isError } = useOutfitData()
  const { obtainedMakeup } = useMakeupData()
  const { mode } = useOutfitImageMode()
  const { sortOrder } = useSortOrder()
  // The index reads the very same visibility toggles the season pages do — they
  // live on one provider spanning the whole /seasons subtree. Without this the
  // index expanded every evolution and glow-up (the toggles default to HIDDEN),
  // so a card advertised a denominator the page it opened never showed.
  const { hideEvolutions, hideGlowups, hidePieces, hideMakeup, hideBaseSets } = useSeasonFilter()

  // The sort button orders seasons by their index (id): 'new' = highest id
  // first, 'old' = lowest first.
  const sortedSeasons = [...seasons].sort((a, b) =>
    sortOrder === 'new' ? b.id - a.id : a.id - b.id
  )

  const categoryTitle = (slug: string) =>
    seasonCategories.find((sc) => sc.slug === slug)?.title ?? slug

  const locationTitle = (slug: string) => locations.find((l) => l.slug === slug)?.title ?? slug

  const groupBySlug = new Map(seasonGroups.map((group) => [group.slug, group]))
  const groupForCategory = new Map(
    seasonCategories.map((category) => [category.slug, category.season_group])
  )

  // Standalone pieces are individual variants parked in one container set. The
  // container carries no season of its own — each variant does — so this pulls
  // the season's variants out of it, mirroring app/seasons/[slug]/page.tsx.
  const standaloneContainer = outfitSets.find((set) => set.slug === STANDALONE_SLUG)

  // Every row of a season, counted in CARDS — the same unit the season page's
  // progress chip and category chips report, so a card here and the page it
  // opens can never show two different denominators. Building it from
  // groupSeasonEntries (rather than counting sets and variants separately) is
  // what guarantees that: it is the one expansion both pages share.
  //
  // A season with `use_season_groups` lists one row per season GROUP, summing
  // across the categories inside it; otherwise it lists its categories. The flag
  // is stored per season rather than derived from whether any category carries a
  // group, because here a group row REPLACES the category rows it collects —
  // deriving it would collapse every season that happens to have one grouped
  // category, including the short ones that read better flat. (The detail page
  // does derive its headings, which is fine: there a heading only decorates the
  // same category sections rather than replacing them.)
  //
  // Categories with no group still stand as their own rows in a grouped season,
  // so nothing is ever dropped from a card by turning the flag on.
  const rowsForSeason = (seasonSlug: string, useGroups: boolean): SeasonRow[] => {
    const seasonSets = outfitSets.filter(
      (set) => set.seasons === seasonSlug && set.slug !== STANDALONE_SLUG
    )

    const standaloneVariants =
      standaloneContainer?.outfit_variants.filter((variant) => variant.seasons === seasonSlug) ?? []

    // The standalone-makeup container has no season of its own, so it has to
    // survive this filter for groupSeasonEntries to pull this season's pieces
    // out of it — exactly how the detail page scopes it.
    const seasonMakeupSets = makeupSets.filter(
      (set) => set.seasons === seasonSlug || isStandaloneMakeupSet(set)
    )

    // Counted under the reader's own visibility toggles, so a row here reports
    // exactly what its season page will show. Evolutions and glow-ups default to
    // hidden: an evolution is another state of a set the season already lists,
    // not another thing to collect.
    const categories = groupSeasonEntries({
      seasonSets,
      standaloneVariants,
      makeupSets: seasonMakeupSets,
      seasonSlug,
      hideEvolutions,
      hideGlowups,
      hidePieces,
      hideMakeup,
      hideBaseSets,
      obtainedOutfit,
      obtainedMakeup,
    })

    // Keyed by group slug where a category has one, by the category slug
    // otherwise — so grouped categories merge and ungrouped ones stay distinct.
    const rows = new Map<
      string,
      { title: string; entries: SeasonEntry[]; grouped: boolean }
    >()

    for (const [categorySlug, entries] of categories) {
      // OTHER_CATEGORY is a synthetic bucket for rows with no category at all,
      // so it has no season_categories row and never carries a group. An
      // unresolvable slug (a group deleted between render and read) falls back
      // to the category too, rather than titling a row with a raw slug.
      const groupSlug = useGroups ? (groupForCategory.get(categorySlug) ?? null) : null
      const group = groupSlug ? groupBySlug.get(groupSlug) : undefined

      const key = group?.slug ?? categorySlug
      const title =
        group?.title ??
        (categorySlug === OTHER_CATEGORY ? OTHER_CATEGORY : categoryTitle(categorySlug))

      const row = rows.get(key)
      if (row) row.entries.push(...entries)
      else rows.set(key, { title, entries, grouped: group !== undefined })
    }

    // A group row counts PIECES, a category row counts CARDS.
    //
    // A group gathers several categories under one line, so counting its cards
    // reduced a whole run of the season to a single digit — "Active Moments"
    // read 1/1 for an eight-piece set, which tells a reader nothing about what
    // is left to collect there. Rolling a group up means its number has to
    // measure the wearables inside it instead.
    //
    // Category rows keep counting cards: they name one section of the season
    // page, and that page's own chips count cards, so switching them too would
    // put every ungrouped season back out of step with the page it opens.
    return [...rows.entries()].map(([key, { title, entries, grouped }]) => ({
      key,
      title,
      ...(grouped ? countCountableEntries(entries) : countEntryCards(entries)),
    }))
  }

  // Rows are derived from outfitSets, which the provider fetches on mount;
  // makeup sets arrive server-rendered. Until the outfit fetch lands the outfit
  // half of every season looks empty, so the rows skeleton rather than claiming
  // "No categories" — that message is reserved for a season that really has
  // none, and a failed fetch says so instead of blaming the data.
  //
  // A season whose only rows are makeup is already complete before the provider
  // resolves, so it renders immediately rather than skeletoning (or, on a failed
  // fetch, blanking) over data that is right there.
  const renderRows = (rows: SeasonRow[]) => {
    if (isLoading && !rows.length) {
      return (
        <>
          <CategoryRowSkeleton />
          <CategoryRowSkeleton />
          <CategoryRowSkeleton />
        </>
      )
    }

    if (!rows.length) {
      return (
        <ListItem disableGutters>
          <ListItemText
            primary={isError ? 'Categories unavailable' : 'No categories'}
            slotProps={{ primary: { color: 'text.secondary' } }}
          />
        </ListItem>
      )
    }

    return rows.map((row) => (
      <ListItem
        key={row.key}
        disableGutters
        secondaryAction={
          <Typography
            aria-label={
              isLoggedIn
                ? `${row.obtained} of ${row.total} collected`
                : `${row.total} ${row.total === 1 ? 'item' : 'items'}`
            }
            color="text.secondary"
            component="span"
            size="small"
            sx={{ whiteSpace: 'nowrap' }}
            variant="body"
          >
            {isLoggedIn ? `${row.obtained}/${row.total}` : row.total}
          </Typography>
        }
      >
        <ListItemText primary={row.title} />
      </ListItem>
    ))
  }

  // Group seasons by location, mirroring how trials group by realm. Seasons are
  // pre-sorted by index so each group preserves the chosen order.
  const locationGroups = Object.entries(
    sortedSeasons.reduce<Record<string, Season[]>>((groups, season) => {
      const location = season.location ?? 'Other'
      ;(groups[location] ??= []).push(season)
      return groups
    }, {})
  )

  return (
    <Box sx={{ containerType: 'inline-size' }}>
      {locationGroups.map(([location, group]) => (
        <Box key={location} sx={{ mb: 4 }}>
          <ListSubheader disableSticky>{locationTitle(location)}</ListSubheader>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              '@container (min-width: 600px)': { gridTemplateColumns: '1fr 1fr' },
              gap: 3,
            }}
          >
            {group.map((season, index) => {
              const rows = rowsForSeason(season.slug, season.use_season_groups)
              // The card's chip sums the very rows it lists, so it can never
              // disagree with the numbers printed beneath it. That holds across
              // the unit split above: a grouped season sums pieces and an
              // ungrouped one sums cards, but each card is internally
              // consistent, and the chip renders a percentage — so the unit
              // never reaches the reader, only the completion it implies.
              const { obtained, total } = rows.reduce(
                (sums, row) => ({
                  obtained: sums.obtained + row.obtained,
                  total: sums.total + row.total,
                }),
                { obtained: 0, total: 0 }
              )
              // Keep each season's ordinal fixed to its position in old→new order,
              // so new→old sorting reverses the displayed numbers (highest first).
              const ordinal = sortOrder === 'new' ? group.length - index : index + 1
              return (
                <SeasonCard
                  key={season.slug}
                  isLoggedIn={isLoggedIn}
                  mode={mode}
                  obtained={obtained}
                  ordinal={ordinal}
                  season={season}
                  total={total}
                >
                  {renderRows(rows)}
                </SeasonCard>
              )
            })}
          </Box>
        </Box>
      ))}
    </Box>
  )
}
