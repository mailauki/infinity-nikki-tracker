import { notFound } from 'next/navigation'
import { Stack, Typography } from '@mui/material'
import { Metadata } from 'next'
import { getSeasonRaw } from '@/hooks/data/admin/seasons'
import { getSeasonCategories } from '@/hooks/data/season-categories'
import { getOutfitSets } from '@/hooks/data/outfit-sets'
import { getMakeupSets } from '@/hooks/data/makeup-sets'
import { isStandaloneMakeupSet } from '@/hooks/makeup'
import { getUserID } from '@/hooks/user'
import { STANDALONE_SLUG } from './season-entries'
import SlugToolBar from '@/components/navbar/slug-toolbar'
import SeasonBanner from './season-banner'
import SeasonContents from './season-contents'
import SeasonOutfitList from './season-outfit-list'
import SeasonOverview from './season-overview'
import SeasonProgress from './season-progress'
import PageShell from '@/components/page-shell'

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

  const [season, seasonCategories, outfitSets, makeupSets, userId] = await Promise.all([
    getSeasonRaw(slug),
    getSeasonCategories(),
    getOutfitSets(),
    getMakeupSets(),
    getUserID(),
  ])

  if (!season) notFound()

  const isLoggedIn = !!userId

  // Sets in this season (the season<->set link lives on outfit_sets). The
  // standalone-pieces container has no season of its own — each of its variants
  // carries one — so it is excluded here and its variants are pulled out below.
  const seasonSets = outfitSets.filter(
    (set) => set.seasons === slug && set.slug !== STANDALONE_SLUG
  )

  const standaloneVariants =
    outfitSets
      .find((set) => set.slug === STANDALONE_SLUG)
      ?.outfit_variants.filter((variant) => variant.seasons === slug) ?? []

  // Makeup sets in this season, plus the standalone-piece container. The
  // container carries no season of its own — each of its variants does — so it
  // has to survive this filter for groupSeasonEntries to pull this season's
  // pieces out of it, exactly as the outfit standalone container is handled
  // above.
  const seasonMakeupSets = makeupSets.filter(
    (set) => set.seasons === slug || isStandaloneMakeupSet(set)
  )

  return (
    <>
      <SlugToolBar />
      <PageShell>
        <SeasonBanner
          altImage={season.alt_image_url}
          image={season.image_url}
          title={season.title}
        />
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography component="h1" size="large" variant="headline">
            {season.title}
          </Typography>
          {isLoggedIn && (
            <SeasonProgress
              makeupSets={seasonMakeupSets}
              seasonSets={seasonSets}
              seasonSlug={slug}
              standaloneVariants={standaloneVariants}
            />
          )}
        </Stack>
        <Typography variant="body">{season.description}</Typography>

        <SeasonOverview
          isLoggedIn={isLoggedIn}
          makeupSets={seasonMakeupSets}
          seasonSets={seasonSets}
          seasonSlug={slug}
          standaloneVariants={standaloneVariants}
        />

        <SeasonOutfitList
          isLoggedIn={isLoggedIn}
          makeupSets={seasonMakeupSets}
          seasonCategories={seasonCategories}
          seasonSets={seasonSets}
          seasonSlug={slug}
          standaloneVariants={standaloneVariants}
        />

        <SeasonContents
          isLoggedIn={isLoggedIn}
          makeupSets={seasonMakeupSets}
          seasonCategories={seasonCategories}
          seasonSets={seasonSets}
          seasonSlug={slug}
          standaloneVariants={standaloneVariants}
        />
      </PageShell>
    </>
  )
}
