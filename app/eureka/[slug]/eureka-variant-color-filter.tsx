'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Stack } from '@mui/material'
import CardGrid from '@/components/card-grid'
import type { EurekaColor, EurekaVariant } from '@/lib/types/eureka'
import EurekaVariantCard from '@/app/eureka/eureka-variant-card'
import ColorChip from './color-chip'
import { useEurekaData } from '@/components/eureka/eureka-context'
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
  const searchParams = useSearchParams()
  const colorParam = searchParams.get('color')
  const initialColor = colors.some((c) => c.slug === colorParam) ? colorParam : null
  const [selectedColor, setSelectedColor] = useState<string | null>(initialColor)

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

      <CardGrid sx={{ py: 0 }}>
        {filteredVariants.map((variant) => (
          <EurekaVariantCard key={variant.id} eurekaVariant={variant} isLoggedIn={isLoggedIn} />
        ))}
      </CardGrid>
    </Stack>
  )
}
