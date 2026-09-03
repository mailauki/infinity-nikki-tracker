'use client'

import {
  Box,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'

import { useOutfitData } from '@/components/outfits/outfit-context'
import { useMakeupData } from '@/components/makeup/makeup-context'
import {
  resolveOutfitImage,
  useOutfitImageMode,
} from '@/components/outfits/outfit-image-mode-context'
import { useSortOrder } from '@/components/sort-context'
import { MakeupSet } from '@/lib/types/makeup'
import { Location, Season, SeasonCategory, SeasonGroup } from '@/lib/types/outfit'
import LazyImage from '@/components/lazy-image'
import { ViewAllButton } from '@/components/view-all-button'
import { isStandaloneMakeupSet } from '@/hooks/makeup'
import {
  countEntryCards,
  groupSeasonEntries,
  OTHER_CATEGORY,
  SeasonEntry,
  STANDALONE_SLUG,
} from '@/app/seasons/[slug]/season-entries'

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
type SeasonRow = {
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

    // The index has no visibility toolbar, so nothing is hidden: every card the
    // season can show is counted.
    const categories = groupSeasonEntries({
      seasonSets,
      standaloneVariants,
      makeupSets: seasonMakeupSets,
      seasonSlug,
      hideEvolutions: false,
      hideGlowups: false,
      obtainedOutfit,
      obtainedMakeup,
    })

    // Keyed by group slug where a category has one, by the category slug
    // otherwise — so grouped categories merge and ungrouped ones stay distinct.
    const rows = new Map<string, { title: string; entries: SeasonEntry[] }>()

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
      else rows.set(key, { title, entries })
    }

    return [...rows.entries()].map(([key, { title, entries }]) => ({
      key,
      title,
      ...countEntryCards(entries),
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
              // Keep each season's ordinal fixed to its position in old→new order,
              // so new→old sorting reverses the displayed numbers (highest first).
              const ordinal = sortOrder === 'new' ? group.length - index : index + 1
              return (
                <Card key={season.slug} sx={{ display: 'flex', flexDirection: 'column' }}>
                  <CardHeader
                    disableTypography
                    avatar={
                      <Typography component="span" size="small" variant="display">
                        {String(ordinal).padStart(2, '0')}
                      </Typography>
                    }
                    sx={{ '& .MuiCardHeader-content': { width: 'calc(100% - 6rem)' } }}
                    title={
                      <Typography noWrap component="h2" size="small" variant="headline">
                        {season.title}
                      </Typography>
                    }
                  />
                  {season.image_url && (
                    <LazyImage
                      image={
                        resolveOutfitImage(mode, {
                          image: season.image_url,
                          alt: season.alt_image_url,
                        }) ?? undefined
                      }
                      kind="media"
                      sx={{ height: 160, mx: 1.5 }}
                      title={season.title}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1 }}>
                    <List dense sx={{ width: '100%' }}>
                      {renderRows(rows)}
                    </List>
                  </CardContent>
                  <CardActions>
                    <ViewAllButton href={`/seasons/${season.slug}`} />
                  </CardActions>
                </Card>
              )
            })}
          </Box>
        </Box>
      ))}
    </Box>
  )
}
