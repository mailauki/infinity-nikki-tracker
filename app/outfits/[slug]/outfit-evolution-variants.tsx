'use client'

import { OutfitSet } from '@/lib/types/outfit'
import { evolutionSortKey } from '@/hooks/outfit'
import CardGrid from '@/components/card-grid'
import OutfitVariantCard from '@/app/outfits/outfit-variant-card'
import { useOutfitData } from '@/components/outfits/outfit-context'

export default function OutfitEvolutionVariants({
  outfitSet,
  isLoggedIn,
  selected,
  isStandalone = false,
}: {
  outfitSet: OutfitSet
  isLoggedIn: boolean
  selected: string | null
  isStandalone?: boolean
}) {
  const { obtainedOutfit, outfitCategories } = useOutfitData()
  const { evolutions, outfit_variants: rawVariants } = outfitSet
  const baseSlug = outfitSet.slug

  const outfit_variants = rawVariants.map((v) => ({
    ...v,
    obtained: obtainedOutfit.some((o) => o.outfit_variant === v.slug),
  }))

  const categoryOrder = outfitCategories.map((c) => c.slug)

  const stateOrder = new Map<string, number>([
    [baseSlug, -Infinity],
    ...evolutions.map((e) => [e.slug, evolutionSortKey(e)] as [string, number]),
  ])
  const orderOf = (stateSlug: string) => stateOrder.get(stateSlug) ?? Infinity

  const matchesSelected = (v: (typeof outfit_variants)[number]) =>
    isStandalone ? v.outfit_category === selected : v.outfit_set === selected

  const sortKey = (v: (typeof outfit_variants)[number]) =>
    isStandalone ? categoryOrder.indexOf(v.outfit_category ?? '') : orderOf(v.outfit_set ?? '')

  const variants = (selected === null ? outfit_variants : outfit_variants.filter(matchesSelected))
    .slice()
    .sort((a, b) => sortKey(a) - sortKey(b))

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
