'use client'

import { Link as Anchor, Typography, Chip, IconButton, Tooltip } from '@mui/material'
import { Collections } from '@mui/icons-material'
import Link from 'next/link'
import { CarouselImage, OutfitSet } from '@/lib/types/outfit'
import { toTitle } from '@/lib/utils'
import LazyImage from '@/components/lazy-image'
import SetDetailCard from '@/components/set-detail-card'
import OutfitCarousel from './outfit-carousel'

export interface OutfitSetDetailCardProps {
  outfitSet: OutfitSet
  selected: string | null
  isLoggedIn: boolean
  /** Progress numerator/denominator across the whole set. */
  obtained: number
  total: number
  /** Resolved image src for the current image mode + selected evolution. */
  imageSrc: string | null | undefined
  /** Whether the alt image is being shown (drives the square aspect ratio). */
  showingAlt: boolean
  /** Carousel images for the current selection; empty when none exist. */
  carouselImages: CarouselImage[]
  hasCarousel: boolean
  /** Gallery toggle state, owned by the parent so it can reset on evolution change. */
  showCarousel: boolean
  onToggleCarousel: () => void
}

// The outfit set-detail card: composes the shared SetDetailCard with the
// outfit-specific media (image or gallery carousel) and rows (ability + gallery
// toggle, season link + category). Kept prop-driven so the parent owns
// image-mode/selection/carousel state; standalone sets don't render it.
export default function OutfitSetDetailCard({
  outfitSet,
  selected,
  isLoggedIn,
  obtained,
  total,
  imageSrc,
  showingAlt,
  carouselImages,
  hasCarousel,
  showCarousel,
  onToggleCarousel,
}: OutfitSetDetailCardProps) {
  const { ability, rarity, label, label_2, style, description, season, seasonCategory } = outfitSet
  const selectedEvolution =
    outfitSet.evolutions.find((evolution) => evolution.slug === selected)?.title || null

  const media =
    showCarousel && hasCarousel ? (
      <OutfitCarousel images={carouselImages} title={outfitSet.title} />
    ) : (
      <LazyImage
        image={imageSrc || outfitSet.image_url || ''}
        kind="media"
        sx={{ width: '100%', maxWidth: 260, aspectRatio: showingAlt ? '1 / 1' : '2 / 3' }}
        title={outfitSet.title}
      />
    )

  const abilityRow = (
    <>
      {ability && <Chip label={toTitle(ability)} />}
      {hasCarousel && (
        <Tooltip title={showCarousel ? 'Hide gallery' : 'Show gallery'}>
          <IconButton
            aria-label={showCarousel ? 'Hide gallery' : 'Show gallery'}
            color={showCarousel ? 'primary' : 'default'}
            onClick={onToggleCarousel}
          >
            <Collections fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </>
  )

  const seasonRow = (
    <>
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
    </>
  )

  return (
    <SetDetailCard
      description={description}
      extraRows={[abilityRow, seasonRow]}
      isLoggedIn={isLoggedIn}
      labels={[label, label_2]}
      media={media}
      obtained={obtained}
      rarity={rarity!}
      style={style}
      title={outfitSet.title}
      titleSuffix={selectedEvolution}
      total={total}
    />
  )
}
