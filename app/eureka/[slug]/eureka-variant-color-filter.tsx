'use client'

import CardGrid from '@/components/card-grid'
import type { EurekaVariant } from '@/lib/types/eureka'
import EurekaVariantCard from '@/app/eureka/eureka-variant-card'
import { useEurekaData } from '@/components/eureka/eureka-context'
import { isVariantObtained } from '@/hooks/eureka'

// Controlled: the selected color is owned by the parent (EurekaSetDetail) so the
// sidebar detail card and the sticky color bar mirror the selection. This component
// only renders the variant grid for that selection.
export default function EurekaVariantColorFilter({
  eureka_variants,
  isLoggedIn,
  selectedColor,
}: {
  eureka_variants: EurekaVariant[]
  isLoggedIn: boolean
  selectedColor: string | null
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

  return (
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
  )
}
