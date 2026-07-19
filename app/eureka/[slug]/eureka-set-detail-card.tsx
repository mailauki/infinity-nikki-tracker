'use client'

import { Link as Anchor } from '@mui/material'
import { Category } from '@mui/icons-material'
import { EurekaSet } from '@/lib/types/eureka'
import { toTitle } from '@/lib/utils'
import LazyImage from '@/components/lazy-image'
import SetDetailCard from '@/components/set-detail-card'
import Link from 'next/link'

export interface EurekaSetDetailCardProps {
  eurekaSet: EurekaSet
  isLoggedIn: boolean
  /** Progress numerator/denominator (scoped to the selected color, if any). */
  obtained: number
  total: number
  /** Selected color's representative variant image; null shows the set image. */
  colorImage?: string | null
}

// The eureka set-detail card: composes the shared SetDetailCard with the
// eureka-specific media and a trials-link row. When a color is selected the
// media mirrors that color's variant image; otherwise it shows the set image.
export default function EurekaSetDetailCard({
  eurekaSet,
  isLoggedIn,
  obtained,
  total,
  colorImage,
}: EurekaSetDetailCardProps) {
  const { title, image_url, rarity, label, style, description, eureka_set_trials } = eurekaSet

  const media = (
    <LazyImage
      alt={title || 'Eureka Set'}
      size="xl"
      src={colorImage || image_url}
      sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
    >
      <Category fontSize="inherit" />
    </LazyImage>
  )

  const trialsRow =
    eureka_set_trials.length > 0 ? (
      <Anchor
        component={Link}
        href={
          eureka_set_trials.length > 1
            ? '/eureka/trials'
            : `/eureka/trials/${eureka_set_trials[0].trial}`
        }
        sx={{ cursor: 'pointer' }}
        underline="hover"
        variant="subtitle2"
      >
        {eureka_set_trials.length > 1
          ? `${eureka_set_trials.length} trials`
          : toTitle(eureka_set_trials[0].trial)}
      </Anchor>
    ) : null

  return (
    <SetDetailCard
      description={description}
      extraRows={trialsRow ? [trialsRow] : []}
      isLoggedIn={isLoggedIn}
      labels={[label]}
      media={media}
      obtained={obtained}
      rarity={rarity!}
      style={style}
      title={title}
      total={total}
    />
  )
}
