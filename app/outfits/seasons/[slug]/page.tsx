import { notFound } from 'next/navigation'
import { List, ListSubheader, Stack, Typography } from '@mui/material'
import { Metadata } from 'next'
import { getSeasonRaw } from '@/hooks/data/admin/seasons'
import { getSeasonCategories } from '@/hooks/data/season-categories'
import { getOutfitSets } from '@/hooks/data/outfit-sets'
import { getUserID } from '@/hooks/user'
import OutfitSetListItem from './outfit-set-item'
import LazyImage from '@/components/lazy-image'
import SlugToolBar from '@/components/slug-toolbar'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const season = await getSeasonRaw(slug)
  if (!season) return {}
  return { title: season.title }
}

export default async function SeasonPage({ params }: Props) {
  const { slug } = await params

  const [season, seasonCategories, outfitSets, userId] = await Promise.all([
    getSeasonRaw(slug),
    getSeasonCategories(),
    getOutfitSets(),
    getUserID(),
  ])

  if (!season) notFound()

  const isLoggedIn = !!userId

  const categoryTitle = (categorySlug: string) =>
    seasonCategories.find((sc) => sc.slug === categorySlug)?.title ?? categorySlug

  // Sets in this season, grouped by their season_category (the season<->category
  // link lives on outfit_sets). Sets without a category fall under "Other".
  const seasonSets = outfitSets.filter((set) => set.seasons === slug)
  const categoryGroups = Object.entries(
    seasonSets.reduce<Record<string, typeof seasonSets>>((groups, set) => {
      const category = set.season_category ?? 'Other'
      ;(groups[category] ??= []).push(set)
      return groups
    }, {})
  )

  return (
    <>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <LazyImage
          image={season.image_url!}
          kind="media"
          sx={{ height: 360 }}
          title={season.title}
        />
        <Typography component="h1" variant="h4">
					{season.title}
				</Typography>
        <Typography variant="body2">{season.description}</Typography>

        {categoryGroups.length ? (
          categoryGroups.map(([category, sets]) => (
            <List
              key={category}
              subheader={
                <ListSubheader sx={{ bgcolor: 'surface.containerLowest' }}>
                  {category === 'Other' ? 'Other' : categoryTitle(category)}
                </ListSubheader>
              }
            >
              {sets.map((set) => (
                <OutfitSetListItem key={set.slug} isLoggedIn={isLoggedIn} set={set} />
              ))}
            </List>
          ))
        ) : (
          <Typography color="text.secondary">No outfit sets in this season yet.</Typography>
        )}
      </Stack>
    </>
  )
}
