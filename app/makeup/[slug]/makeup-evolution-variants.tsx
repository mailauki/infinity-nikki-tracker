'use client'

import { MakeupSet } from '@/lib/types/makeup'
import CardGrid from '@/components/card-grid'
import MakeupVariantCard from '@/app/makeup/makeup-variant-card'
import { useMakeupData } from '@/components/makeup/makeup-context'

export default function MakeupEvolutionVariants({
  makeupSet,
  isLoggedIn,
  selected,
}: {
  makeupSet: MakeupSet
  isLoggedIn: boolean
  selected: string | null
}) {
  const { obtainedMakeup } = useMakeupData()
  const { evolutions, makeup_variants: rawVariants } = makeupSet
  const baseSlug = makeupSet.slug

  const makeup_variants = rawVariants.map((v) => ({
    ...v,
    obtained: obtainedMakeup.some((o) => o.makeup_variant === v.slug),
  }))

  const stateOrder = new Map<string, number>([
    [baseSlug, -Infinity],
    ...evolutions.map((e, index) => [e.slug, index] as [string, number]),
  ])
  const orderOf = (stateSlug: string) => stateOrder.get(stateSlug) ?? Infinity

  const variants = makeup_variants
    .filter((v) => !selected || v.makeup_set === selected)
    .slice()
    .sort((a, b) => orderOf(a.makeup_set ?? '') - orderOf(b.makeup_set ?? ''))

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
        <MakeupVariantCard key={variant.id} isLoggedIn={isLoggedIn} makeupVariant={variant} />
      ))}
    </CardGrid>
  )
}
