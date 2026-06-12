'use client'

import { useState } from 'react'
import { Stack, Typography, Chip, Container, IconButton, Tooltip } from '@mui/material'
import { Collections } from '@mui/icons-material'
import { OutfitSet } from '@/lib/types/outfit'
import { percent } from '@/hooks/count-obtained'
import { toTitle } from '@/lib/utils'
import RarityStars from '@/components/rarity-stars'
import ProgressChip from '@/components/progress-chip'
import SlugToolBar from '@/components/slug-toolbar'
import LazyImage from '@/components/lazy-image'
import OutfitEvolutionVariants from './outfit-evolution-variants'
import OutfitCarousel from './outfit-carousel'
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
  const [selected, setSelected] = useState<string | null>(evolutionParamsSlug || null)
  const [showCarousel, setShowCarousel] = useState(false)

  function handleSelectEvolution(slug: string | null) {
    setSelected(slug)
    setShowCarousel(false)
  }

  const selectedEvolution = evolutions.find((e) => e.slug === selected) ?? null

  const image = selectedEvolution ? selectedEvolution.image_url : outfitSet.image_url
  const alt = selectedEvolution ? selectedEvolution.alt_image_url : outfitSet.alt_image_url

  const imageSrc = resolveOutfitImage(mode, { image, alt })
  const showingAlt = mode === 'alt' && !!alt

  // When no evolution is selected, combine outfit-set images + all evolution images.
  // When an evolution is selected, show only that evolution's images.
  const carouselImages = selectedEvolution
    ? (selectedEvolution.carousel_images ?? [])
    : [
        ...(outfitSet.carousel_images ?? []),
        ...outfitSet.evolutions.flatMap((e) => e.carousel_images ?? []),
      ]
  const hasCarousel = carouselImages.length > 0

  const obtained = outfit_variants.reduce((sum, v) => sum + (v.obtained ? 1 : 0), 0)
  const total = outfit_variants.length

  return (
    <>
      <SlugToolBar isAdmin={isAdmin} />
      <Stack useFlexGap direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
        <Container disableGutters fixed maxWidth="xs">
          <Stack spacing={2} sx={{ alignItems: 'center' }}>
            {showCarousel && hasCarousel ? (
              <OutfitCarousel images={carouselImages} title={outfitSet.title} />
            ) : null}
            {(!showCarousel || !hasCarousel) && showingAlt && (
              <LazyImage
                alt={outfitSet.title}
                kind="square"
                src={imageSrc || outfitSet.image_url || ''}
              />
            )}
            {(!showCarousel || !hasCarousel) && !showingAlt && (
              <LazyImage
                image={imageSrc || outfitSet.image_url || ''}
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
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                {hasCarousel && (
                  <Tooltip title={showCarousel ? 'Hide gallery' : 'Show gallery'}>
                    <IconButton
                      aria-label={showCarousel ? 'Hide gallery' : 'Show gallery'}
                      color={showCarousel ? 'primary' : 'default'}
                      size="small"
                      onClick={() => setShowCarousel((v) => !v)}
                    >
                      <Collections fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
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
          onSelect={handleSelectEvolution}
        />
      </Stack>
    </>
  )
}
