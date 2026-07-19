'use client'

import {
  Link as Anchor,
  Stack,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  CardContent,
} from '@mui/material'
import { Collections } from '@mui/icons-material'
import Link from 'next/link'
import { CarouselImage, OutfitSet } from '@/lib/types/outfit'
import { toTitle } from '@/lib/utils'
import RarityStars from '@/components/rarity-stars'
import ProgressChip from '@/components/progress-chip'
import LazyImage from '@/components/lazy-image'
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

// The set-detail card body rendered inside the outfit slug page's SidebarBody:
// the set image (or gallery carousel) on top, then the metadata block (rarity,
// labels, style, progress, ability, season). Kept prop-driven so the parent
// owns image-mode/selection/carousel state; standalone sets don't render it.
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

  return (
    <>
      <Stack spacing={1.5} sx={{ alignItems: 'center', pt: 1 }}>
        {showCarousel && hasCarousel ? (
          <OutfitCarousel images={carouselImages} title={outfitSet.title} />
        ) : null}
        {(!showCarousel || !hasCarousel) && showingAlt && (
          <LazyImage
            image={imageSrc || outfitSet.image_url || ''}
            kind="media"
            sx={{ width: '100%', maxWidth: 260, aspectRatio: '1 / 1' }}
            title={outfitSet.title}
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
          <Typography variant="subtitle1">
            {outfitSet.title}
            {selectedEvolution && `: ${selectedEvolution}`}
          </Typography>
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
                  onClick={onToggleCarousel}
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
          <Typography sx={{ textWrap: 'wrap' }} variant="body2">
            {description}
          </Typography>
        </Stack>
      </CardContent>
    </>
  )
}
