'use client'

import { Stack, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { OutfitSet } from '@/lib/types/outfit'
import { isGlowup, evolutionSortKey } from '@/hooks/outfit'
import ProgressChip from '@/components/progress-chip'
import CardGrid from '@/components/card-grid'
import OutfitVariantCard from '@/app/outfits/outfit-variant-card'
import { useOutfitData } from '@/components/outfits/outfit-context'

export default function OutfitEvolutionVariants({
  outfitSet,
  isLoggedIn,
  selected,
  onSelect,
  // Standalone-pieces is a container of individually-authored variants with no
  // real evolution states, so its toggle filters by outfit category instead.
  isStandalone = false,
}: {
  outfitSet: OutfitSet
  isLoggedIn: boolean
  // `null` selection means "show all". Otherwise an evolution state slug, or —
  // in standalone mode — an outfit_category slug.
  selected: string | null
  onSelect: (next: string | null) => void
  isStandalone?: boolean
}) {
  const { obtainedOutfit, outfitCategories } = useOutfitData()
  const { evolutions, outfit_variants: rawVariants } = outfitSet

  // Base state slug = the set's own slug; each evolution carries its own slug.
  const baseSlug = outfitSet.slug

  const outfit_variants = rawVariants.map((v) => ({
    ...v,
    obtained: obtainedOutfit.some((o) => o.outfit_variant === v.slug),
  }))

  // Category mode (standalone) filters/sorts by outfit_category using the
  // canonical category order; evolution mode filters/sorts by state slug.
  const categoryOrder = outfitCategories.map((c) => c.slug)
  const presentCategories = outfitCategories.filter((c) =>
    outfit_variants.some((v) => v.outfit_category === c.slug)
  )

  // Sort variants by the display order of their state: base first, then
  // evolutions in order (1, 2, …), glow-up last (order = 0 → Infinity key).
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

  const obtained = variants.reduce((sum, v) => sum + (v.obtained ? 1 : 0), 0)
  const total = variants.length

  return (
    <Stack spacing={2} sx={{ flex: 1 }}>
      <Stack direction="row" sx={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
        {isStandalone ? (
          <ToggleButtonGroup
            exclusive
            size="small"
            sx={{ flexWrap: 'wrap' }}
            value={selected}
            onChange={(_, next) => onSelect(next)}
          >
            <ToggleButton value={null as unknown as string}>All</ToggleButton>
            {presentCategories.map((category) => (
              <ToggleButton key={category.slug} value={category.slug}>
                {category.title}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        ) : (
          <ToggleButtonGroup
            exclusive
            disabled={!selected && evolutions.length === 0}
            size="small"
            sx={{ flexWrap: 'wrap' }}
            value={selected}
            onChange={(_, next) => onSelect(next)}
          >
            {[null, ...evolutions].map((evolution) => {
              const value = evolution?.slug ?? baseSlug
              const glowup = !!evolution && isGlowup(evolution)
              return (
                <ToggleButton key={value} value={value}>
                  {glowup && '✦ '}
                  {evolution ? evolution.title : 'Base'}
                </ToggleButton>
              )
            })}
          </ToggleButtonGroup>
        )}
        {isLoggedIn && <ProgressChip obtained={obtained} total={total} variant="parts" />}
      </Stack>

      {/*
        Container-query columns (not viewport breakpoints) so the grid reflows to
        fewer columns when the details sidebar opens and narrows the content column,
        matching the main outfits page. The layout's minWidth floor keeps it from
        shrinking past a usable width. Thresholds mirror MUI's sm/lg/xl.
      */}
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
    </Stack>
  )
}
