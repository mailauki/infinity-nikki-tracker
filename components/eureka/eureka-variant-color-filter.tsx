'use client'

import { useState } from 'react'
import { Box, Chip, Stack } from '@mui/material'
import { Done } from '@mui/icons-material'
import { GRID_COLUMNS } from '@/lib/types/props'
import type { Color, EurekaVariant } from '@/lib/types/eureka'
import EurekaVariantCard from './eureka-variant-card'
import LazyAvatar from './lazy-avatar'

export default function EurekaVariantColorFilter({
  colors,
  eureka_variants,
  isLoggedIn,
}: {
  colors: Color[]
  eureka_variants: EurekaVariant[]
  isLoggedIn: boolean
}) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null)

  const filteredVariants =
    selectedColor === null
      ? eureka_variants
      : eureka_variants.filter((v) => v.color === selectedColor)

  function toggleColor(slug: string) {
    setSelectedColor((prev) => (prev === slug ? null : slug))
  }

  return (
    <Stack spacing={3}>
      <Stack useFlexGap direction="row" flexWrap="wrap" spacing={0.5}>
        {colors.map((color) => {
          const active = selectedColor === color.slug
          return (
            <Chip
              key={color.slug}
              avatar={
                <LazyAvatar alt={color.title || color.slug} size="xs" src={color.image_url!} />
              }
              color={active ? 'primary' : 'default'}
              deleteIcon={<Done />}
              label={color.title}
              clickable
              onClick={() => toggleColor(color.slug)}
              onDelete={active ? () => toggleColor(color.slug) : undefined}
            />
          )
        })}
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: GRID_COLUMNS,
          gap: { xs: 1, sm: 1.5, md: 2 },
          py: 0,
        }}
      >
        {filteredVariants.map((variant) => (
          <EurekaVariantCard key={variant.id} eurekaVariant={variant} isLoggedIn={isLoggedIn} />
        ))}
      </Box>
    </Stack>
  )
}
