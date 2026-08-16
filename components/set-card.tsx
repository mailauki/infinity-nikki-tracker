'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { CardActionArea, Stack, Typography } from '@mui/material'
import LazyImage from '@/components/lazy-image'
import RarityStars from '@/components/rarity-stars'
import CardShell, { CollectionToggle } from '@/components/card-shell'

// Two fixed sx objects rather than one built inline: stable identities keep
// `LazyImage`'s memo effective across the virtualized grids' scroll re-renders.
const MEDIA_SX = {
  default: { width: '100%', aspectRatio: '2 / 3' },
  alt: { width: '100%', aspectRatio: '1 / 1' },
} as const

export default function SetCard({
  href,
  title,
  rarity,
  imageSrc,
  showAlt,
  obtained,
  total,
  isLoggedIn,
  in: shown,
  unmountOnExit,
  onToggle,
  onExited,
  topLeft,
  topRight,
}: {
  href: string
  title: string
  rarity: number
  imageSrc: string
  showAlt: boolean
  obtained: number
  total: number
  isLoggedIn: boolean
  in: boolean
  unmountOnExit?: boolean
  onToggle: () => void
  onExited?: () => void
  topLeft?: ReactNode
  topRight?: ReactNode
}) {
  const media = (
    <LazyImage
      image={imageSrc}
      kind="media"
      sx={showAlt ? MEDIA_SX.alt : MEDIA_SX.default}
      title={title}
    />
  )

  return (
    <CardShell
      in={shown}
      topLeft={topLeft}
      topRight={topRight}
      unmountOnExit={unmountOnExit}
      onExited={onExited}
    >
      {href ? (
        <CardActionArea aria-label={`${title} — rarity ${rarity}`} component={Link} href={href}>
          {media}
        </CardActionArea>
      ) : (
        media
      )}
      <Stack direction="row" sx={{ px: 1, alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack
          spacing={1}
          sx={{ px: 1, py: 2, maxWidth: isLoggedIn ? 'calc(100% - 40px)' : '100%' }}
        >
          <Typography noWrap variant="overline">
            {title}
          </Typography>
          <RarityStars rarity={rarity} />
        </Stack>
        <CollectionToggle
          label={obtained === total ? 'Mark as not obtained' : 'Mark as obtained'}
          obtained={obtained === total}
          show={isLoggedIn}
          onToggle={onToggle}
        />
      </Stack>
    </CardShell>
  )
}
