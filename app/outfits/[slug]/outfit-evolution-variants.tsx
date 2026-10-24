'use client'

import { OutfitSet } from '@/lib/types/outfit'
import { evolutionSortKey, matchesOutfitFilter } from '@/hooks/outfit'
import CardGrid from '@/components/card-grid'
import OutfitVariantCard from '@/app/outfits/outfit-variant-card'
import { useOutfitData } from '@/components/outfits/outfit-context'

export default function OutfitEvolutionVariants({
  outfitSet,
  isLoggedIn,
  selected,
}: {
  outfitSet: OutfitSet
  isLoggedIn: boolean
  selected: string | null
}) {
  const { obtainedOutfit } = useOutfitData()
  const { evolutions, outfit_variants: rawVariants } = outfitSet
  const baseSlug = outfitSet.slug

  const outfit_variants = rawVariants.map((v) => ({
    ...v,
    obtained: obtainedOutfit.some((o) => o.outfit_variant === v.slug),
  }))

  const stateOrder = new Map<string, number>([
    [baseSlug, -Infinity],
    ...evolutions.map((e) => [e.slug, evolutionSortKey(e)] as [string, number]),
  ])
  const orderOf = (stateSlug: string) => stateOrder.get(stateSlug) ?? Infinity

  const variants = outfit_variants
    .filter((v) => matchesOutfitFilter(v, selected))
    .sort((a, b) => orderOf(a.outfit_set ?? '') - orderOf(b.outfit_set ?? ''))

  return (
    <CardGrid
      columns={{
        gridTemplateColumns: 'repeat(2, 1fr)',
        '@container (min-width: 600px)': { gridTemplateColumns: 'repeat(3, 1fr)' },
        '@container (min-width: 1200px)': { gridTemplateColumns: 'repeat(4, 1fr)' },
        '@container (min-width: 1536px)': { gridTemplateColumns: 'repeat(5, 1fr)' },
      }}
    >
      {variants.map((variant) => (
        <OutfitVariantCard key={variant.id} isLoggedIn={isLoggedIn} outfitVariant={variant} />
      ))}
    </CardGrid>
  )
}
