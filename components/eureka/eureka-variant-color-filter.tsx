'use client'

import { useState } from 'react'
import { Box, Stack } from '@mui/material'
import { GRID_COLUMNS_CONTAINER, GRID_CONTAINER } from '@/lib/types/props'
import type { EurekaColor, EurekaVariant } from '@/lib/types/eureka'
import EurekaVariantCard from './eureka-variant-card'
import ColorChip from '../color-chip'
import { useEurekaData } from './eureka-context'
import { isVariantObtained } from '@/hooks/eureka'

export default function EurekaVariantColorFilter({
  colors,
  eureka_variants,
  isLoggedIn,
}: {
  colors: EurekaColor[]
  eureka_variants: EurekaVariant[]
  isLoggedIn: boolean
}) {
  const { obtainedKeys } = useEurekaData()
  const [selectedColor, setSelectedColor] = useState<string | null>(null)

  const variantsWithObtained = eureka_variants.map((v) => ({
    ...v,
    obtained: isVariantObtained(v, obtainedKeys),
  }))

  const filteredVariants =
    selectedColor === null
      ? variantsWithObtained
      : variantsWithObtained.filter((v) => v.color === selectedColor)

  function toggleColor(slug: string) {
    setSelectedColor((prev) => (prev === slug ? null : slug))
  }

  return (
    <Stack spacing={3}>
      <Stack useFlexGap direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
        {colors.map((color) => (
          <ColorChip
            key={color.slug}
            color={color}
            selectedColor={selectedColor!}
            toggleColor={toggleColor}
          />
        ))}
      </Stack>

      <Box sx={GRID_CONTAINER}>
        <Box
          sx={{
            display: 'grid',
            ...GRID_COLUMNS_CONTAINER,
            gap: { xs: 1, sm: 1.5, md: 2 },
            py: 0,
          }}
        >
          {filteredVariants.map((variant) => (
            <EurekaVariantCard key={variant.id} eurekaVariant={variant} isLoggedIn={isLoggedIn} />
          ))}
        </Box>
      </Box>
    </Stack>
  )
}
