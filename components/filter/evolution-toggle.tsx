'use client'

import { Tooltip, ToggleButton } from '@mui/material'
import ToggleIcon from '../toggle-icon'

export default function EvolutionToggle({
  hideEvolutions,
  onHideEvolutionsChange,
}: {
  hideEvolutions: boolean
  onHideEvolutionsChange: () => void
}) {
  return (
    <Tooltip title="Hide Evolutions">
      <ToggleButton
        selected={hideEvolutions}
        value="hideEvolutions"
        onChange={onHideEvolutionsChange}
        size="small"
      >
        <ToggleIcon
          isSelected={hideEvolutions}
          item={{ title: 'evolution', image: '/icons/evolution.png' }}
          size="xs"
        />
      </ToggleButton>
    </Tooltip>
  )
}
