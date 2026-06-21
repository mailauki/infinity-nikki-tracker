import { notFound } from 'next/navigation'
import { Stack, Typography } from '@mui/material'
import { Metadata } from 'next'
import { getSeasonRaw } from '@/hooks/data/admin/seasons'
import { getSeasonCategories } from '@/hooks/data/season-categories'
import { getOutfitSets } from '@/hooks/data/outfit-sets'
import { getUserID } from '@/hooks/user'
import LazyImage from '@/components/lazy-image'
import SlugToolBar from '@/components/slug-toolbar'
import { SeasonFilterProvider } from './season-filter-context'
import SeasonOutfitList from './season-outfit-list'
import SeasonProgress from './season-progress'

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

  // Sets in this season (the season<->set link lives on outfit_sets).
  const seasonSets = outfitSets.filter((set) => set.seasons === slug)

  return (
    <SeasonFilterProvider>
      <SlugToolBar isAdmin={false} />
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <LazyImage
          image={season.image_url!}
          kind="media"
          sx={{ height: 360 }}
          title={season.title}
        />
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography component="h1" variant="h4">
            {season.title}
          </Typography>
          {isLoggedIn && <SeasonProgress seasonSets={seasonSets} />}
        </Stack>
        <Typography variant="body2">{season.description}</Typography>

        <SeasonOutfitList
          isLoggedIn={isLoggedIn}
          seasonCategories={seasonCategories}
          seasonSets={seasonSets}
        />
      </Stack>
    </SeasonFilterProvider>
  )
}
