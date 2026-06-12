'use client'

import { Box, Stack, ToggleButton, ToggleButtonGroup, Toolbar } from '@mui/material'
import { OutfitSet } from '@/lib/types/outfit'
import { percent } from '@/hooks/count-obtained'
import ProgressChip from '@/components/progress-chip'
import OutfitVariantCard from './outfit-variant-card'

// Sentinel for the "Base" toggle, since the Base evolution has no slug.
const BASE = 'base'

export default function OutfitEvolutionVariants({
  outfitSet,
  isLoggedIn,
  selected,
  onSelect,
}: {
  outfitSet: OutfitSet
  isLoggedIn: boolean
  // `null` selection means "show all evolutions".
  selected: string | null
  onSelect: (next: string | null) => void
}) {
  const { evolutions, outfit_variants } = outfitSet

  // Sort by evolution order, with the null (default) evolution first.
  const evolutionOrder = new Map(evolutions.map((e) => [e.slug, e.order]))
  const orderOf = (slug: string | null) =>
    slug === null ? -Infinity : (evolutionOrder.get(slug) ?? Infinity)

  const variants = (
    selected === null
      ? outfit_variants
      : outfit_variants.filter((v) =>
          selected === BASE ? v.evolution === null : v.evolution === selected
        )
  )
    .slice()
    .sort((a, b) => orderOf(a.evolution) - orderOf(b.evolution))

  const obtained = variants.reduce((sum, v) => sum + (v.obtained ? 1 : 0), 0)
  const total = variants.length

  return (
    <Stack spacing={2} sx={{ flex: 1 }}>
      <Toolbar disableGutters sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={selected}
          onChange={(_, next) => onSelect(next)}
        >
          {[null, ...evolutions].map((evolution) => {
            const value = evolution?.slug ?? BASE
            return (
              <ToggleButton key={value} value={value}>
                {evolution?.subtitle ? evolution.subtitle : 'Base'}
              </ToggleButton>
            )
          })}
        </ToggleButtonGroup>

        {isLoggedIn && <ProgressChip percentage={percent(obtained, total)} size="sm" />}
      </Toolbar>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr 1fr',
            sm: '1fr 1fr 1fr',
            md: '1fr 1fr',
            lg: '1fr 1fr 1fr 1fr',
            xl: '1fr 1fr 1fr 1fr 1fr',
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
