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
import {
  resolveOutfitImage,
  useOutfitImageMode,
} from '@/components/outfits/outfit-image-mode-context'
import { useSortOrder } from '@/components/sort-context'
import { MakeupSet } from '@/lib/types/makeup'
import { Location, Season, SeasonCategory } from '@/lib/types/outfit'
import LazyImage from '@/components/lazy-image'
import { ViewAllButton } from '@/components/view-all-button'
import { STANDALONE_SLUG } from '@/app/seasons/[slug]/season-entries'
import { STANDALONE_MAKEUP_SLUG } from '@/hooks/makeup'
import CompositionCounts, { COMPOSITION_CONTAINER } from '@/components/seasons/composition-counts'

// Mirrors the row skeleton in ./loading.tsx so a card's categories keep the
// same shape from route-level fallback through to loaded data.
function CategoryRowSkeleton() {
  return (
    <ListItem
      disableGutters
      secondaryAction={
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Skeleton height={16} variant="text" width={16} />
          <Skeleton height={16} variant="text" width={16} />
        </Stack>
      }
    >
      <ListItemText primary={<Skeleton height={20} variant="text" width="50%" />} />
    </ListItem>
  )
}

export default function SeasonsContent({
  seasons,
  seasonCategories,
  locations,
  makeupSets,
}: {
  seasons: Season[]
  seasonCategories: SeasonCategory[]
  locations: Location[]
  makeupSets: MakeupSet[]
}) {
  const { outfitSets, isLoading, isError } = useOutfitData()
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

  // Standalone pieces are individual variants parked in one container set. The
  // container carries no season of its own — each variant does — so counting
  // pieces means looking inside it rather than at the set list. Mirrors the
  // extraction in app/seasons/[slug]/page.tsx.
  const standaloneVariants =
    outfitSets.find((set) => set.slug === STANDALONE_SLUG)?.outfit_variants ?? []

  // Makeup sets carry their own seasons / season_category, exactly like outfit
  // sets, and the season detail page counts them — so the card chips have to as
  // well or the index undercounts what the season opens to.
  //
  // A makeup set counts as its individual wearables rather than as one set: it
  // is five separate pieces (base makeup, contact lenses, eyebrows, eyelashes,
  // lips), and the detail page lists them as five cards. `makeup_variants` on a
  // base row already includes every evolution's variants (see createMakeupSet),
  // so this sums the whole set graph in one go — which is what the detail page
  // shows once the evolution toggles are off.
  const makeupPiecesIn = (seasonSlug: string, categorySlug: string) =>
    makeupSets
      .filter(
        (set) =>
          set.slug !== STANDALONE_MAKEUP_SLUG &&
          set.seasons === seasonSlug &&
          set.season_category === categorySlug
      )
      .reduce((sum, set) => sum + set.makeup_variants.length, 0)

  const outfitsIn = (seasonSlug: string, categorySlug: string) =>
    outfitSets.filter(
      (set) =>
        set.slug !== STANDALONE_SLUG &&
        set.seasons === seasonSlug &&
        set.season_category === categorySlug
    ).length

  // Standalone makeup pieces live in their own container set, which carries no
  // season — each variant does — so they are counted per-variant just like the
  // outfit pieces above.
  const standaloneMakeupVariants =
    makeupSets.find((set) => set.slug === STANDALONE_MAKEUP_SLUG)?.makeup_variants ?? []

  const piecesIn = (seasonSlug: string, categorySlug: string) =>
    standaloneVariants.filter(
      (variant) => variant.seasons === seasonSlug && variant.season_category === categorySlug
    ).length +
    standaloneMakeupVariants.filter(
      (variant) => variant.seasons === seasonSlug && variant.season_category === categorySlug
    ).length +
    makeupPiecesIn(seasonSlug, categorySlug)

  // A season's categories are the distinct season_category values across all
  // three sources: the outfit sets assigned to that season, the standalone
  // pieces whose own season matches, and the season's makeup sets (the
  // seasons<->categories link lives on the rows, not a join table). Some
  // categories hold only pieces or only makeup, so counting outfit sets alone
  // would drop them from the list entirely.
  const categoriesForSeason = (seasonSlug: string) =>
    [
      ...new Set([
        ...outfitSets
          .filter((set) => set.slug !== STANDALONE_SLUG && set.seasons === seasonSlug)
          .map((set) => set.season_category),
        ...standaloneVariants
          .filter((variant) => variant.seasons === seasonSlug)
          .map((variant) => variant.season_category),
        ...makeupSets
          .filter((set) => set.slug !== STANDALONE_MAKEUP_SLUG && set.seasons === seasonSlug)
          .map((set) => set.season_category),
        ...standaloneMakeupVariants
          .filter((variant) => variant.seasons === seasonSlug)
          .map((variant) => variant.season_category),
      ]).values(),
    ].filter((slug): slug is string => Boolean(slug))

  // Outfit categories are derived from outfitSets, which the provider fetches on
  // mount; makeup sets arrive server-rendered. Until the outfit fetch lands the
  // outfit half of every season looks empty, so the rows skeleton rather than
  // claiming "No categories" — that message is reserved for a season that really
  // has none, and a failed fetch says so instead of blaming the data.
  //
  // A season whose only rows are makeup is already complete before the provider
  // resolves, so it renders its categories immediately rather than skeletoning
  // (or, on a failed fetch, blanking) over data that is right there.
  const renderCategories = (seasonSlug: string, categories: string[]) => {
    if (isLoading && !categories.length) {
      return (
        <>
          <CategoryRowSkeleton />
          <CategoryRowSkeleton />
          <CategoryRowSkeleton />
        </>
      )
    }

    if (!categories.length) {
      return (
        <ListItem disableGutters>
          <ListItemText
            primary={isError ? 'Categories unavailable' : 'No categories'}
            slotProps={{ primary: { color: 'text.secondary' } }}
          />
        </ListItem>
      )
    }

    return categories.map((slug) => {
      const outfits = outfitsIn(seasonSlug, slug)
      const pieces = piecesIn(seasonSlug, slug)

      return (
        <ListItem
          key={slug}
          disableGutters
          secondaryAction={<CompositionCounts outfits={outfits} pieces={pieces} />}
          sx={COMPOSITION_CONTAINER}
        >
          <ListItemText primary={categoryTitle(slug)} />
        </ListItem>
      )
    })
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
              const categories = categoriesForSeason(season.slug)
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
                      {renderCategories(season.slug, categories)}
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
