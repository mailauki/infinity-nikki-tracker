'use client'

import { Stack, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { MakeupSet } from '@/lib/types/makeup'
import ProgressChip from '@/components/progress-chip'
import StickyBar from '@/components/navbar/sticky-bar'

export default function MakeupToggleBar({
  makeupSet,
  selected,
  onSelect,
  isLoggedIn,
  obtained,
  total,
}: {
  makeupSet: MakeupSet
  selected: string | null
  onSelect: (next: string | null) => void
  isLoggedIn: boolean
  obtained: number
  total: number
}) {
  const { evolutions } = makeupSet
  const baseSlug = makeupSet.slug

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
            return (
              <ToggleButton key={value} sx={{ backdropFilter: 'blur(8px)' }} value={value}>
                {/* Sits beside "Base" under the set's own heading — short name only. */}
                {evolution ? (evolution.title ?? evolution.slug) : 'Base'}
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
