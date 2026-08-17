'use client'

import { ReactNode } from 'react'
import { CardHeader, Stack } from '@mui/material'
import { Category } from '@mui/icons-material'
import LazyImage from '@/components/lazy-image'
import CardShell, { CollectionToggle } from '@/components/card-shell'

// Hoisted so `LazyImage`'s memo actually holds: these cards re-render on every
// scroll-driven pass of the virtualized grids, and an inline sx object or a
// freshly created fallback element would change identity each time.
const IMAGE_SX = { bgcolor: 'transparent', color: 'text.disabled' } as const
const FALLBACK_ICON = <Category fontSize="inherit" />

export default function VariantCard({
  imageSrc,
  imageAlt,
  title,
  subtitle,
  obtained,
  isLoggedIn,
  disableToggle = false,
  optimized = false,
  in: shown,
  animateExit = false,
  onToggle,
  onExited,
  topLeft,
}: {
  imageSrc?: string | null
  imageAlt: string
  title?: string
  subtitle: string
  obtained: boolean
  isLoggedIn: boolean
  disableToggle?: boolean
  optimized?: boolean
  in: boolean
  animateExit?: boolean
  onToggle: () => void
  onExited?: () => void
  topLeft?: ReactNode
}) {
  return (
    <CardShell
      animateExit={animateExit}
      in={shown}
      raised={obtained}
      topLeft={topLeft}
      onExited={onExited}
    >
      <Stack sx={{ pt: 1, alignItems: 'center' }}>
        <LazyImage
          alt={imageAlt}
          color="transparent"
          optimized={optimized}
          size="lg"
          src={imageSrc ?? undefined}
          sx={IMAGE_SX}
        >
          {FALLBACK_ICON}
        </LazyImage>
      </Stack>
      <CardHeader
        action={
          <CollectionToggle
            label={obtained ? 'Mark as not obtained' : 'Mark as obtained'}
            obtained={obtained}
            show={isLoggedIn && !disableToggle}
            onToggle={onToggle}
          />
        }
        slotProps={{
          title: { variant: 'title', size: 'small', noWrap: true },
          subheader: { variant: 'body', size: 'small', noWrap: true },
        }}
        subheader={subtitle}
        sx={{ pr: 1, '& .MuiCardHeader-content': { maxWidth: 'calc(100% - 40px)' } }}
        title={title}
      />
    </CardShell>
  )
}
