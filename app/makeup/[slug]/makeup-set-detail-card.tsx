'use client'

import { Button, Link as Anchor, Typography } from '@mui/material'
import Link from 'next/link'
import { MakeupSet } from '@/lib/types/makeup'
import LazyImage from '@/components/lazy-image'
import SetDetailCard from '@/components/set-detail-card'

export interface MakeupSetDetailCardProps {
  makeupSet: MakeupSet
  selected: string | null
  isLoggedIn: boolean
  /** Progress numerator/denominator across the whole set. */
  obtained: number
  total: number
  /** Resolved image src for the current image mode + selected evolution. */
  imageSrc: string | null | undefined
  /** Whether the alt image is being shown (drives the square aspect ratio). */
  showingAlt: boolean
}

// The makeup set-detail card: composes the shared SetDetailCard with the
// makeup-specific media (image) and rows (style label + season, paired outfit
// link). Kept prop-driven so the parent owns image-mode/selection state.
export default function MakeupSetDetailCard({
  makeupSet,
  selected,
  isLoggedIn,
  obtained,
  total,
  imageSrc,
  showingAlt,
}: MakeupSetDetailCardProps) {
  const { rarity, label, style, description, season, seasonCategory, outfitSet } = makeupSet
  const selectedEvolution =
    makeupSet.evolutions.find((evolution) => evolution.slug === selected)?.title || null

  const media = (
    <LazyImage
      image={imageSrc || makeupSet.image_url || ''}
      kind="media"
      sx={{ width: '100%', maxWidth: 260, aspectRatio: showingAlt ? '1 / 1' : '2 / 3' }}
      title={makeupSet.title}
    />
  )

  const seasonRow = (
    <>
      <Anchor
        component={Link}
        href={`/outfits/seasons/${makeupSet.seasons}`}
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

  const outfitRow = outfitSet && (
    <Button component={Link} href={`/outfits/${outfitSet.slug}`} size="small" variant="outlined">
      {outfitSet.title}
    </Button>
  )

  return (
    <SetDetailCard
      description={description}
      extraRows={[seasonRow, outfitRow]}
      isLoggedIn={isLoggedIn}
      labels={[label]}
      media={media}
      obtained={obtained}
      rarity={rarity!}
      style={style}
      title={selectedEvolution ? selectedEvolution : makeupSet.title}
      total={total}
    />
  )
}
