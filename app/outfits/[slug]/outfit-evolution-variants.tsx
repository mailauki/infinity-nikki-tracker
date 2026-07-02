'use client'

import { Box, Stack, ToggleButton, ToggleButtonGroup, Toolbar } from '@mui/material'
import { OutfitSet } from '@/lib/types/outfit'
import { isGlowup, evolutionSortKey } from '@/hooks/outfit'
import ProgressChip from '@/components/progress-chip'
import OutfitVariantCard from '@/app/outfits/outfit-variant-card'
import { useOutfitData } from '@/components/outfits/outfit-context'

export default function OutfitEvolutionVariants({
  outfitSet,
  isLoggedIn,
  selected,
  onSelect,
}: {
  outfitSet: OutfitSet
  isLoggedIn: boolean
  // `null` selection means "show all evolutions (states)".
  selected: string | null
  onSelect: (next: string | null) => void
}) {
  const { obtainedOutfit } = useOutfitData()
  const { evolutions, outfit_variants: rawVariants } = outfitSet

  // Base state slug = the set's own slug; each evolution carries its own slug.
  const baseSlug = outfitSet.slug

  const outfit_variants = rawVariants.map((v) => ({
    ...v,
    obtained: obtainedOutfit.some((o) => o.outfit_variant === v.slug),
  }))

  // Sort variants by the display order of their state: base first, then
  // evolutions in order (1, 2, …), glow-up last (order = 0 → Infinity key).
  const stateOrder = new Map<string, number>([
    [baseSlug, -Infinity],
    ...evolutions.map((e) => [e.slug, evolutionSortKey(e)] as [string, number]),
  ])
  const orderOf = (stateSlug: string) => stateOrder.get(stateSlug) ?? Infinity

  const variants = (
    selected === null ? outfit_variants : outfit_variants.filter((v) => v.outfit_set === selected)
  )
    .slice()
    .sort((a, b) => orderOf(a.outfit_set ?? '') - orderOf(b.outfit_set ?? ''))

  const obtained = variants.reduce((sum, v) => sum + (v.obtained ? 1 : 0), 0)
  const total = variants.length

  return (
    <Stack spacing={2} sx={{ flex: 1 }}>
      <Stack direction="row" sx={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
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
        {isLoggedIn && <ProgressChip obtained={obtained} total={total} variant="parts" />}
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
            xl: 'repeat(5, 1fr)',
          },
          gap: { xs: 1, sm: 1.5, md: 2 },
        }}
      >
        {variants.map((variant) => (
          <OutfitVariantCard key={variant.id} isLoggedIn={isLoggedIn} outfitVariant={variant} />
        ))}
      </Box>
    </Stack>
  )
}
