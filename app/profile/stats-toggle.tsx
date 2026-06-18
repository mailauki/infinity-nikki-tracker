'use client'

import { ReactNode, useState } from 'react'
import { Box, Stack, ToggleButton, ToggleButtonGroup } from '@mui/material'

type StatsView = 'outfits' | 'eureka'

export default function StatsToggle({
  outfits,
  eureka,
}: {
  outfits: ReactNode
  eureka: ReactNode
}) {
  const [view, setView] = useState<StatsView>('outfits')

  return (
    <>
      <ToggleButtonGroup
        exclusive
        aria-label="Collection stats view"
        color="primary"
        size="small"
        value={view}
        onChange={(_, next: StatsView | null) => {
          if (next) setView(next)
        }}
      >
        <ToggleButton value="outfits">Outfit Stats</ToggleButton>
        <ToggleButton value="eureka">Eureka Stats</ToggleButton>
      </ToggleButtonGroup>
      <Box hidden={view !== 'outfits'}>
        <Stack spacing={2}>{outfits}</Stack>
      </Box>
      <Box hidden={view !== 'eureka'}>
        <Stack spacing={2}>{eureka}</Stack>
      </Box>
    </>
  )
}
