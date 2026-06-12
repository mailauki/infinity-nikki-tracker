'use client'

import { useState } from 'react'
import { Stack, Typography, Chip, Container } from '@mui/material'
import { OutfitSet } from '@/lib/types/outfit'
import { percent } from '@/hooks/count-obtained'
import { toTitle } from '@/lib/utils'
import RarityStars from '@/components/rarity-stars'
import ProgressChip from '@/components/progress-chip'
import SlugToolBar from '@/components/slug-toolbar'
import LazyImage from '@/components/lazy-image'
import OutfitEvolutionVariants from './outfit-evolution-variants'
import { resolveOutfitImage, useOutfitImageMode } from './outfit-image-mode-context'
import { useSearchParams } from 'next/navigation'

export default function OutfitSetDetail({
  outfitSet,
  isLoggedIn,
  isAdmin,
}: {
  outfitSet: OutfitSet
  isLoggedIn: boolean
  isAdmin: boolean
}) {
  const { ability, evolutions, outfit_variants, rarity, label, label_2, style, description } =
    outfitSet
  const { mode } = useOutfitImageMode()

  const searchParams = useSearchParams()
  const evolutionParams = searchParams.get('evolution')
  const evolutionParamsSlug = evolutionParams ? `${outfitSet.slug}-${evolutionParams}` : null
  // `null` selection means "show all evolutions".
  const [selected, setSelected] = useState<string | null>(evolutionParamsSlug || null)

  const selectedEvolution = evolutions.find((e) => e.slug === selected) ?? null

  // Resolve the poster image for the current mode. Evolutions have no poster,
  // so poster mode falls back to the evolution image. Alt falls back to image.
  const poster = selectedEvolution ? null : outfitSet.poster_image_url
  const image = selectedEvolution ? selectedEvolution.image_url : outfitSet.image_url
  const alt = selectedEvolution ? selectedEvolution.alt_image_url : outfitSet.alt_image_url

  const posterSrc = resolveOutfitImage(mode, { poster, image, alt })
  const showingAlt = mode === 'alt' && !!alt

  const obtained = outfit_variants.reduce((sum, v) => sum + (v.obtained ? 1 : 0), 0)
  const total = outfit_variants.length

  return (
    <>
      <SlugToolBar isAdmin={isAdmin} />
      <Stack useFlexGap direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
        <Container disableGutters fixed maxWidth="xs">
          <Stack spacing={2} sx={{ alignItems: 'center' }}>
            {showingAlt ? (
              <LazyImage
                alt={outfitSet.title}
                kind="square"
                src={posterSrc || outfitSet.image_url || ''}
              />
            ) : (
              <LazyImage
                image={posterSrc || outfitSet.image_url || ''}
                kind="media"
                sx={{ width: '100%', maxWidth: 300, aspectRatio: '9 / 16' }}
                title={outfitSet.title}
              />
            )}
            <Stack
              direction="row"
              sx={{ width: '100%', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Typography color="textSecondary" variant="subtitle2">
                <RarityStars rarity={rarity!} />
              </Typography>
              <Stack direction="row" spacing={0.5}>
                <Chip label={toTitle(label ?? '')} variant="outlined" />
                {label_2 && <Chip label={toTitle(label_2)} variant="outlined" />}
              </Stack>
            </Stack>
            <Stack
              direction="row"
              sx={{ width: '100%', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Typography color="textSecondary" variant="body1">
                {toTitle(style ?? '')}
              </Typography>
              {isLoggedIn && <ProgressChip percentage={percent(obtained, total)} size="md" />}
            </Stack>
            <Stack
              direction="row"
              sx={{ width: '100%', alignItems: 'center', justifyContent: 'space-between' }}
            >
              {ability && <Chip label={toTitle(ability)} />}
            </Stack>
            <Typography variant="body2">{description}</Typography>
          </Stack>
        </Container>

        <OutfitEvolutionVariants
          isLoggedIn={isLoggedIn}
          outfitSet={outfitSet}
          selected={selected}
          onSelect={setSelected}
        />
      </Stack>
    </>
  )
}
