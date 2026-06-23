'use client'

import { AutoAwesome, Looks3, Looks4, Looks5, LooksOne, LooksTwo } from '@mui/icons-material'
import { FormControl, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material'

const EVOLUTION_ORDERS = [
  { order: 1, icon: <LooksOne /> },
  { order: 2, icon: <LooksTwo /> },
  { order: 3, icon: <Looks3 /> },
  { order: 4, icon: <Looks4 /> },
  { order: 5, icon: <Looks5 /> },
]

export default function EvolutionOrderToggle({
  availableOrders,
  selectedEvolution,
  onEvolutionChange,
  disabled,
}: {
  availableOrders: number[]
  selectedEvolution: number | null
  onEvolutionChange: (event: React.MouseEvent<HTMLElement>, newEvolution: number | null) => void
  disabled?: boolean
}) {
  const orders = EVOLUTION_ORDERS.filter((e) => availableOrders.includes(e.order))
  // Glow-up evolutions are stored as order 0; show the toggle only when some set has one.
  const hasGlowup = availableOrders.includes(0)

  return (
    <FormControl>
      <ToggleButtonGroup
        exclusive
        aria-label="Evolution order"
        disabled={disabled}
        size="small"
        value={selectedEvolution}
        onChange={onEvolutionChange}
      >
        {orders.map(({ order, icon }) => (
          <Tooltip key={order} title={`Evolution ${order}`}>
            <ToggleButton aria-label={`Evolution ${order}`} value={order}>
              {icon}
            </ToggleButton>
          </Tooltip>
        ))}
        {hasGlowup && (
          <Tooltip title="Glow-up">
            <ToggleButton aria-label="Glow-up" value={0}>
              <AutoAwesome />
            </ToggleButton>
          </Tooltip>
        )}
      </ToggleButtonGroup>
    </FormControl>
  )
}
