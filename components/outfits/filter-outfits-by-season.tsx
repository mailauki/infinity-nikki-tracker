'use client'

import {
  Box,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material'

import { useOutfitData } from '@/components/outfits/outfit-context'
import { Season, SeasonCategory } from '@/lib/types/outfit'
import LazyImage from '../lazy-image'
import { ViewAllButton } from '../view-all-button'

export default function FilterOutfitsBySeason({
  seasons,
  seasonCategories,
}: {
  seasons: Season[]
  seasonCategories: SeasonCategory[]
}) {
  const { outfitSets } = useOutfitData()

  const categoryTitle = (slug: string) =>
    seasonCategories.find((sc) => sc.slug === slug)?.title ?? slug

  // A season's categories are the distinct season_category values among the
  // outfit sets assigned to that season (the seasons<->categories link lives on
  // outfit_sets, not a join table).
  const categoriesForSeason = (seasonSlug: string) =>
    [
      ...new Set(
        outfitSets
          .filter((set) => set.seasons === seasonSlug)
          .map((set) => set.season_category)
          .filter((slug): slug is string => Boolean(slug))
      ),
    ]

  return (
    <Box sx={{ containerType: 'inline-size' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          '@container (min-width: 600px)': { gridTemplateColumns: '1fr 1fr' },
          gap: 3,
        }}
      >
        {seasons.map((season) => {
          const categories = categoriesForSeason(season.slug)
          return (
            <Card key={season.slug} sx={{ display: 'flex', flexDirection: 'column' }}>
              <CardHeader
                disableTypography
                title={
                  <Typography
                    noWrap
                    component="h2"
                    sx={{ maxWidth: { xs: 300, sm: 360 } }}
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
                      <ListItem key={slug} disableGutters secondaryAction={<Typography variant='caption'>{outfitSets.filter(set => set.season_category === slug).length}</Typography>}>
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
  )
}
