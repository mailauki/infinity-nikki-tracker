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
  Typography,
} from '@mui/material'

import { useOutfitData } from '@/components/outfits/outfit-context'
import {
  resolveOutfitImage,
  useOutfitImageMode,
} from '@/components/outfits/outfit-image-mode-context'
import { useSortOrder } from '@/components/sort-context'
import { Location, Season, SeasonCategory } from '@/lib/types/outfit'
import LazyImage from '@/components/lazy-image'
import { ViewAllButton } from '@/components/view-all-button'

// Mirrors the row skeleton in ./loading.tsx so a card's categories keep the
// same shape from route-level fallback through to loaded data.
function CategoryRowSkeleton() {
  return (
    <ListItem disableGutters secondaryAction={<Skeleton height={16} variant="text" width={16} />}>
      <ListItemText primary={<Skeleton height={20} variant="text" width="50%" />} />
    </ListItem>
  )
}

export default function SeasonsContent({
  seasons,
  seasonCategories,
  locations,
}: {
  seasons: Season[]
  seasonCategories: SeasonCategory[]
  locations: Location[]
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

  // A season's categories are the distinct season_category values among the
  // outfit sets assigned to that season (the seasons<->categories link lives on
  // outfit_sets, not a join table).
  const categoriesForSeason = (seasonSlug: string) => [
    ...new Set(
      outfitSets
        .filter((set) => set.seasons === seasonSlug)
        .map((set) => set.season_category)
        .filter((slug): slug is string => Boolean(slug))
    ),
  ]

  // Categories are derived from outfitSets, which the provider fetches on mount.
  // Until that lands every season looks empty, so the rows skeleton rather than
  // claiming "No categories" — that message is reserved for a season that really
  // has none, and a failed fetch says so instead of blaming the data.
  const renderCategories = (seasonSlug: string, categories: string[]) => {
    if (isLoading) {
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

    return categories.map((slug) => (
      <ListItem
        key={slug}
        disableGutters
        secondaryAction={
          <Typography size="small" variant="body">
            {
              outfitSets.filter(
                (set) => set.season_category === slug && set.seasons === seasonSlug
              ).length
            }
          </Typography>
        }
      >
        <ListItemText primary={categoryTitle(slug)} />
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
