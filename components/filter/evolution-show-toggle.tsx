'use client'

import { LooksOne } from '@mui/icons-material'
import { ToggleButton, Tooltip } from '@mui/material'
import ToggleIcon from '../toggle-icon'

export default function EvolutionShowToggle({
  showBase,
  showEvolutions,
  showGlowups,
  onShowBaseChange,
  onShowEvolutionsChange,
  onShowGlowupsChange,
}: {
  showBase: boolean
  showEvolutions: boolean
  showGlowups: boolean
  onShowBaseChange: () => void
  onShowEvolutionsChange: () => void
  onShowGlowupsChange: () => void
}) {
  return (
    <>
      <Tooltip title="Show Base">
        <ToggleButton selected={showBase} size="small" value="showBase" onChange={onShowBaseChange}>
          <LooksOne fontSize="small" />
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Show Evolutions">
        <ToggleButton
          selected={showEvolutions}
          size="small"
          value="showEvolutions"
          onChange={onShowEvolutionsChange}
        >
          <ToggleIcon
            image="/icons/evolution.png"
            isSelected={showEvolutions}
            size="xs"
            title="evolution"
          />
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Show Glow-ups">
        <ToggleButton
          selected={showGlowups}
          size="small"
          sx={{ py: 0.75 }}
          value="showGlowups"
          onChange={onShowGlowupsChange}
        >
          <ToggleIcon image="/icons/glowup.png" isSelected={showGlowups} size="xs" title="glowup" />
        </ToggleButton>
      </Tooltip>
    </>
  )
}
