'use client'

import { Coffee } from '@mui/icons-material'
import { IconButton, Tooltip } from '@mui/material'

export default function CoffeeButton() {
  return (
    <Tooltip title="Buy me a coffee">
      <IconButton
        aria-label="Buy me a coffee"
        component="a"
        href="https://buymeacoffee.com/mailauki"
        rel="noopener noreferrer"
        size="small"
        target="_blank"
      >
        <Coffee fontSize="small" />
      </IconButton>
    </Tooltip>
  )
}
