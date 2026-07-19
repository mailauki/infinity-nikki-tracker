'use client'

import { Stack } from '@mui/material'
import CardGrid from '@/components/card-grid'
import ProgressChip from '@/components/progress-chip'
import type { EurekaColor, EurekaVariant } from '@/lib/types/eureka'
import EurekaVariantCard from '@/app/eureka/eureka-variant-card'
import ColorChip from './color-chip'
import { useEurekaData } from '@/components/eureka/eureka-context'
import { isVariantObtained } from '@/hooks/eureka'

// Controlled: the selected color is owned by the parent (EurekaSetDetail) so the
// sidebar detail card can mirror the selection. This component only renders the
// color chips + variant grid for that selection.
export default function EurekaVariantColorFilter({
  colors,
  eureka_variants,
  isLoggedIn,
  selectedColor,
  onToggleColor,
}: {
  colors: EurekaColor[]
  eureka_variants: EurekaVariant[]
  isLoggedIn: boolean
  selectedColor: string | null
  onToggleColor: (slug: string) => void
}) {
  const { obtainedKeys } = useEurekaData()

  const variantsWithObtained = eureka_variants.map((v) => ({
    ...v,
    obtained: isVariantObtained(v, obtainedKeys),
  }))

  const filteredVariants =
    selectedColor === null
      ? variantsWithObtained
      : variantsWithObtained.filter((v) => v.color === selectedColor)

  const obtained = filteredVariants.reduce((sum, v) => sum + (v.obtained ? 1 : 0), 0)
  const total = filteredVariants.length

  return (
    <Stack spacing={2} sx={{ flex: 1 }}>
      <Stack direction="row" sx={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <Stack useFlexGap direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
          {colors.map((color) => (
            <ColorChip
              key={color.slug}
              color={color}
              selectedColor={selectedColor!}
              toggleColor={onToggleColor}
            />
          ))}
        </Stack>
        {isLoggedIn && <ProgressChip obtained={obtained} total={total} variant="parts" />}
      </Stack>

      {/*
        Container-query columns (not viewport breakpoints) so the grid reflows to
        fewer columns when the details sidebar opens and narrows the content column,
        matching the outfit detail page. Thresholds mirror MUI's sm/lg/xl.
      */}
      <CardGrid
        columns={{
          gridTemplateColumns: 'repeat(2, 1fr)',
          '@container (min-width: 600px)': { gridTemplateColumns: 'repeat(3, 1fr)' },
          '@container (min-width: 1200px)': { gridTemplateColumns: 'repeat(4, 1fr)' },
          '@container (min-width: 1536px)': { gridTemplateColumns: 'repeat(5, 1fr)' },
        }}
        sx={{ py: 0 }}
      >
        {filteredVariants.map((variant) => (
          <EurekaVariantCard key={variant.id} eurekaVariant={variant} isLoggedIn={isLoggedIn} />
        ))}
      </CardGrid>
    </Stack>
  )
}
