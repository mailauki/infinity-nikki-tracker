'use client'

import { Stack, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { OutfitSet } from '@/lib/types/outfit'
import { isGlowup } from '@/hooks/outfit'
import ProgressChip from '@/components/progress-chip'
import StickyBar from '@/components/navbar/sticky-bar'

export default function OutfitToggleBar({
  outfitSet,
  selected,
  onSelect,
  isLoggedIn,
  obtained,
  total,
}: {
  outfitSet: OutfitSet
  selected: string | null
  onSelect: (next: string | null) => void
  isLoggedIn: boolean
  obtained: number
  total: number
}) {
  const { evolutions } = outfitSet
  const baseSlug = outfitSet.slug

  return (
    <StickyBar>
      <Stack
        direction="row"
        sx={{ flexGrow: 1, alignItems: 'flex-end', justifyContent: 'space-between', py: 1 }}
      >
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
                {/* Sits beside "Base" under the set's own heading — short name only. */}
                {evolution ? (evolution.subtitle ?? evolution.title) : 'Base'}
              </ToggleButton>
            )
          })}
        </ToggleButtonGroup>
        {isLoggedIn && (
          <Stack sx={{ py: 0.6 }}>
            <ProgressChip obtained={obtained} total={total} variant="parts" />
          </Stack>
        )}
      </Stack>
    </StickyBar>
  )
}
