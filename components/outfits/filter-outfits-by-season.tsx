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
  Typography,
} from '@mui/material'

import { useOutfitData } from '@/components/outfits/outfit-context'
import { Location, Season, SeasonCategory } from '@/lib/types/outfit'
import LazyImage from '../lazy-image'
import { ViewAllButton } from '../view-all-button'

export default function FilterOutfitsBySeason({
  seasons,
  seasonCategories,
  locations,
}: {
  seasons: Season[]
  seasonCategories: SeasonCategory[]
  locations: Location[]
}) {
  const { outfitSets } = useOutfitData()

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

  // Group seasons by location, mirroring how trials group by realm.
  const locationGroups = Object.entries(
    seasons.reduce<Record<string, Season[]>>((groups, season) => {
      const location = season.location ?? 'Other'
      ;(groups[location] ??= []).push(season)
      return groups
    }, {})
  )

  return (
    <Box sx={{ containerType: 'inline-size' }}>
      {locationGroups.map(([location, group]) => (
        <Box key={location} sx={{ mb: 4 }}>
          <ListSubheader sx={{ bgcolor: 'surface.containerLowest' }}>
            {locationTitle(location)}
          </ListSubheader>
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
              return (
                <Card key={season.slug} sx={{ display: 'flex', flexDirection: 'column' }}>
                  <CardHeader
                    disableTypography
                    avatar={
                      <Typography component="span" variant="h3">
                        {String(index + 1).padStart(2, '0')}
                      </Typography>
                    }
										sx={{ '& .MuiCardHeader-content': { width: 'calc(100% - 6rem)' } }}
                    title={
                      <Typography
                        noWrap
                        component="h2"
                        variant="h6"
                      >
                        {season.title}
                      </Typography>
                    }
                  />
                  {season.image_url && (
                    <LazyImage
                      image={season.image_url}
                      kind="media"
                      sx={{ height: 160 }}
                      title={season.title}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1 }}>
                    <List dense sx={{ width: '100%' }}>
                      {categories.length ? (
                        categories.map((slug) => (
                          <ListItem
                            key={slug}
                            disableGutters
                            secondaryAction={
                              <Typography variant="caption">
                                {outfitSets.filter((set) => set.season_category === slug).length}
                              </Typography>
                            }
                          >
                            <ListItemText primary={categoryTitle(slug)} />
                          </ListItem>
                        ))
                      ) : (
                        <ListItem disableGutters>
                          <ListItemText
                            primary="No categories"
                            slotProps={{ primary: { color: 'text.secondary' } }}
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                  <CardActions>
                    <ViewAllButton href={`/outfits/seasons/${season.slug}`} />
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
