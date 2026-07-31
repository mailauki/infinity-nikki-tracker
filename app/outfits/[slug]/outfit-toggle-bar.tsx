'use client'

import { Stack, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { OutfitSet } from '@/lib/types/outfit'
import { isGlowup } from '@/hooks/outfit'
import ProgressChip from '@/components/progress-chip'
import StickyBar from '@/components/navbar/sticky-bar'
import { useOutfitData } from '@/components/outfits/outfit-context'

export default function OutfitToggleBar({
  outfitSet,
  isStandalone = false,
  selected,
  onSelect,
  isLoggedIn,
  obtained,
  total,
}: {
  outfitSet: OutfitSet
  isStandalone?: boolean
  selected: string | null
  onSelect: (next: string | null) => void
  isLoggedIn: boolean
  obtained: number
  total: number
}) {
  const { obtainedOutfit, outfitCategories } = useOutfitData()
  const { evolutions, outfit_variants: rawVariants } = outfitSet
  const baseSlug = outfitSet.slug

  const outfit_variants = rawVariants.map((v) => ({
    ...v,
    obtained: obtainedOutfit.some((o) => o.outfit_variant === v.slug),
  }))

  const presentCategories = outfitCategories.filter((c) =>
    outfit_variants.some((v) => v.outfit_category === c.slug)
  )

  return (
    <StickyBar>
      <Stack
        direction="row"
        sx={{ flex: 1, alignItems: 'center', justifyContent: 'space-between' }}
      >
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
              <ToggleButton
                key={category.slug}
                sx={{ backdropFilter: 'blur(8px)' }}
                value={category.slug}
              >
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
                <ToggleButton key={value} sx={{ backdropFilter: 'blur(8px)' }} value={value}>
                  {glowup && '✦ '}
                  {evolution ? evolution.title : 'Base'}
                </ToggleButton>
              )
            })}
          </ToggleButtonGroup>
        )}
        {isLoggedIn && <ProgressChip obtained={obtained} total={total} variant="parts" />}
      </Stack>
    </StickyBar>
  )
}
