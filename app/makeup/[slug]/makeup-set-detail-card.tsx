'use client'

import { Link as Anchor, Typography } from '@mui/material'
import Link from 'next/link'
import { MakeupSet } from '@/lib/types/makeup'
import { linkedSetHref } from '@/lib/types/outfit'
import LazyImage from '@/components/lazy-image'
import LinkedSetCard from '@/components/linked-set-card'
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
// makeup-specific media (image) and rows (season, paired outfit link). Kept
// prop-driven so the parent owns image-mode/selection state.
export default function MakeupSetDetailCard({
  makeupSet,
  selected,
  isLoggedIn,
  obtained,
  total,
  imageSrc,
  showingAlt,
}: MakeupSetDetailCardProps) {
  const { rarity, style, description, season, seasonCategory } = makeupSet
  const selectedEvolutionSet =
    makeupSet.evolutions.find((evolution) => evolution.slug === selected) ?? null
  const selectedEvolution = selectedEvolutionSet?.title || null

  // Pairings are per-row: the base makeup set and each of its evolutions carry
  // their own `outfit_set` FK, so the link follows the current selection and
  // falls back to the base set's own pairing.
  const outfitSet = selectedEvolutionSet?.outfitSet ?? makeupSet.outfitSet

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
        href={`/seasons/${makeupSet.seasons}`}
        sx={{ cursor: 'pointer' }}
        underline="hover"
        variant="title"
      >
        {season?.title}
      </Anchor>
      <Typography size="large" sx={{ textAlign: 'right' }} variant="body">
        {seasonCategory?.title}
      </Typography>
    </>
  )

  // The pairing often points at an outfit evolution rather than the base set, so
  // linkedSetHref() resolves it to the base route plus an `?evolution=` param.
  // The alt image is preferred, matching the detail pages' default image mode.
  const outfitRow = outfitSet ? (
    <LinkedSetCard
      href={linkedSetHref('outfits', outfitSet)}
      image={outfitSet.alt_image_url || outfitSet.image_url}
      title={outfitSet.title}
    />
  ) : null

  return (
    <SetDetailCard
      description={description}
      extraRows={[seasonRow, outfitRow].filter(Boolean)}
      isLoggedIn={isLoggedIn}
      media={media}
      obtained={obtained}
      rarity={rarity!}
      style={style}
      title={selectedEvolution ? selectedEvolution : makeupSet.title}
      total={total}
    />
  )
}
