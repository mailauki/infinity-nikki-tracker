'use client'

import { Stack } from '@mui/material'
import StickyBar from '@/components/navbar/sticky-bar'
import ProgressChip from '@/components/progress-chip'
import type { EurekaColor } from '@/lib/types/eureka'
import ColorChip from './color-chip'

export default function EurekaColorBar({
  colors,
  selectedColor,
  onToggleColor,
  isLoggedIn,
  obtained,
  total,
}: {
  colors: EurekaColor[]
  selectedColor: string | null
  onToggleColor: (slug: string) => void
  isLoggedIn: boolean
  obtained: number
  total: number
}) {
  return (
    <StickyBar>
      <Stack
        direction="row"
        sx={{ flex: 1, alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Stack useFlexGap direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
          {colors.map((color) => (
            <ColorChip
              key={color.slug}
              color={color}
              selectedColor={selectedColor!}
              toggleColor={onToggleColor}
            />
          ))}
        </Stack>
        {isLoggedIn && <ProgressChip obtained={obtained} total={total} variant="parts" />}
      </Stack>
    </StickyBar>
  )
}
