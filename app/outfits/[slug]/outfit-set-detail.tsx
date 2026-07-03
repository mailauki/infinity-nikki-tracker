'use client'

import { useState } from 'react'
import {
  Link as Anchor,
  Stack,
  Typography,
  Chip,
  Container,
  IconButton,
  Tooltip,
  Card,
  CardContent,
} from '@mui/material'
import { Collections } from '@mui/icons-material'
import { OutfitSet } from '@/lib/types/outfit'
import { toTitle } from '@/lib/utils'
import RarityStars from '@/components/rarity-stars'
import ProgressChip from '@/components/progress-chip'
import SlugToolBar from '@/components/slug-toolbar'
import LazyImage from '@/components/lazy-image'
import OutfitEvolutionVariants from './outfit-evolution-variants'
import OutfitCarousel from './outfit-carousel'
import {
  resolveOutfitImage,
  useOutfitImageMode,
} from '@/components/outfits/outfit-image-mode-context'
import { useOutfitData } from '@/components/outfits/outfit-context'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

// The standalone-pieces set is a container of individually-authored variants
// with no cohesive identity, so its detail card is hidden and its toggle
// filters by outfit category instead of evolution state.
const STANDALONE_SLUG = 'standalone-pieces'

export default function OutfitSetDetail({
  outfitSet,
  isLoggedIn,
  isAdmin,
}: {
  outfitSet: OutfitSet
  isLoggedIn: boolean
  isAdmin: boolean
}) {
  const {
    ability,
    evolutions,
    outfit_variants: rawVariants,
    rarity,
    label,
    label_2,
    style,
    description,
    season,
    seasonCategory,
  } = outfitSet
  const { mode } = useOutfitImageMode()
  const { obtainedOutfit } = useOutfitData()

  const outfit_variants = rawVariants.map((v) => ({
    ...v,
    obtained: obtainedOutfit.some((o) => o.outfit_variant === v.slug),
  }))

  const isStandalone = outfitSet.slug === STANDALONE_SLUG

  const searchParams = useSearchParams()
  const evolutionParams = searchParams.get('evolution')
  // Standalone has no evolution states, so never seed a selection from the param.
  const evolutionParamsSlug =
    !isStandalone && evolutionParams ? `${outfitSet.slug}-${evolutionParams}` : null
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
        {!isStandalone && (
          <Container disableGutters fixed maxWidth="xs">
            <Card elevation={0} sx={{ minWidth: 300, minHeight: 'fit-content' }}>
              <Stack spacing={1.5} sx={{ alignItems: 'center', pt: 1 }}>
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
                    sx={{ width: '100%', maxWidth: 260, aspectRatio: '2 / 3' }}
                    title={outfitSet.title}
                  />
                )}
              </Stack>
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack
                    direction="row"
                    sx={{ width: '100%', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <RarityStars rarity={rarity!} />
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
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
                    {isLoggedIn && <ProgressChip obtained={obtained} size="md" total={total} />}
                  </Stack>
                  <Stack
                    direction="row"
                    sx={{ width: '100%', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    {ability && <Chip label={toTitle(ability)} />}
                    {hasCarousel && (
                      <Tooltip title={showCarousel ? 'Hide gallery' : 'Show gallery'}>
                        <IconButton
                          aria-label={showCarousel ? 'Hide gallery' : 'Show gallery'}
                          color={showCarousel ? 'primary' : 'default'}
                          onClick={() => setShowCarousel((v) => !v)}
                        >
                          <Collections fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                  <Stack
                    direction="row"
                    sx={{ width: '100%', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Anchor
                      component={Link}
                      href={`/outfits/seasons/${outfitSet.seasons}`}
                      sx={{ cursor: 'pointer' }}
                      underline="hover"
                      variant="subtitle2"
                    >
                      {season?.title}
                    </Anchor>
                    <Typography sx={{ textAlign: 'right' }} variant="body1">
                      {seasonCategory?.title}
                    </Typography>
                  </Stack>
                  <Typography variant="body2">{description}</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Container>
        )}

        <OutfitEvolutionVariants
          isLoggedIn={isLoggedIn}
          isStandalone={isStandalone}
          outfitSet={outfitSet}
          selected={selected}
          onSelect={handleSelectEvolution}
        />
      </Stack>
    </>
  )
}
