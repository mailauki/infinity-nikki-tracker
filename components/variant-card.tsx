'use client'

import { ReactNode } from 'react'
import { CardHeader, Stack } from '@mui/material'
import { Category } from '@mui/icons-material'
import LazyImage from '@/components/lazy-image'
import CardShell, { CollectionToggle } from '@/components/card-shell'

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
  onToggle: () => void
  onExited?: () => void
  topLeft?: ReactNode
}) {
  return (
    <CardShell in={shown} raised={obtained} topLeft={topLeft} onExited={onExited}>
      <Stack sx={{ pt: 1, alignItems: 'center' }}>
        <LazyImage
          alt={imageAlt}
          color="transparent"
          optimized={optimized}
          size="lg"
          src={imageSrc ?? undefined}
          sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
        >
          <Category fontSize="inherit" />
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
          title: { variant: 'subtitle2', noWrap: true },
          subheader: { variant: 'caption', noWrap: true },
        }}
        subheader={subtitle}
        sx={{ pr: 1, '& .MuiCardHeader-content': { maxWidth: 'calc(100% - 40px)' } }}
        title={title}
      />
    </CardShell>
  )
}
