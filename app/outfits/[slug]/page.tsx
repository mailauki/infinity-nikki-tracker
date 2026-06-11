import { Suspense } from 'react'

import { getUserID, getUserRole } from '@/hooks/user'
import { getOutfitSet } from '@/hooks/data/outfit-sets'
import { Stack, Typography, Chip } from '@mui/material'
import type { Metadata } from 'next'
import { toTitle } from '@/lib/utils'
import RarityStars from '@/components/rarity-stars'
import { percent } from '@/hooks/count-obtained'
import ProgressChip from '@/components/progress-chip'
import SlugToolBar from '@/components/slug-toolbar'
import OutfitSetImage from '@/components/outfits/outfit-set-image'
import OutfitEvolutionVariants from '@/components/outfits/outfit-evolution-variants'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const outfitSet = await getOutfitSet(slug)

  return { title: outfitSet.title }
}

export default async function OutfitSetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  return (
    <Suspense>
      <OutfitSet slug={slug} />
    </Suspense>
  )
}

async function OutfitSet({ slug }: { slug: string }) {
  const [outfitSet, user_id, role] = await Promise.all([
    getOutfitSet(slug),
    getUserID(),
    getUserRole(),
  ])
  const isLoggedIn = !!user_id
  const isAdmin = role === 'admin'

  const { ability, outfit_variants, rarity, label, label_2, style, description } = outfitSet

  const obtained = outfit_variants.reduce((sum, v) => sum + (v.obtained ? 1 : 0), 0)
  const total = outfit_variants.length

  return (
    <>
      <SlugToolBar isAdmin={isAdmin} />
      <Stack direction="row" spacing={2}>
        <Stack spacing={2} sx={{ minWidth: '300px', maxWidth: '400px' }}>
          <OutfitSetImage set={outfitSet} />
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography color="textSecondary" variant="subtitle2">
              <RarityStars rarity={rarity!} />
            </Typography>
            <Stack direction="row" spacing={0.5}>
              <Chip label={toTitle(label ?? '')} variant="outlined" />
              {label_2 && <Chip label={toTitle(label_2)} variant="outlined" />}
            </Stack>
          </Stack>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography color="textSecondary" variant="body1">
              {toTitle(style ?? '')}
            </Typography>
            {isLoggedIn && <ProgressChip percentage={percent(obtained, total)} size="md" />}
          </Stack>
          {ability && <Chip label={toTitle(ability)} />}
          <Typography variant="body2">{description}</Typography>
        </Stack>

        <OutfitEvolutionVariants isLoggedIn={isLoggedIn} outfitSet={outfitSet} />
      </Stack>
    </>
  )
}
