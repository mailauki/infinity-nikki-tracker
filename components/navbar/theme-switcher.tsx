'use client'

import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  useColorScheme,
} from '@mui/material'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import BrightnessMediumIcon from '@mui/icons-material/BrightnessMedium'
import CheckIcon from '@mui/icons-material/Check'
import { useState } from 'react'

const modes = [
  { value: 'system', label: 'System', icon: <BrightnessMediumIcon fontSize="small" /> },
  { value: 'light', label: 'Light', icon: <LightModeIcon fontSize="small" /> },
  { value: 'dark', label: 'Dark', icon: <DarkModeIcon fontSize="small" /> },
] as const

export default function ThemeSwitcher() {
  const { mode, setMode } = useColorScheme()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const currentIcon = modes.find((m) => m.value === mode)?.icon ?? <BrightnessMediumIcon />

  return (
    <>
      <IconButton
        aria-label="Change theme"
        size="small"
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        {currentIcon}
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={Boolean(anchorEl)}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        onClose={() => setAnchorEl(null)}
      >
        {modes.map(({ value, label, icon }) => (
          <MenuItem
            key={value}
            selected={mode === value}
            onClick={() => {
              setMode(value)
              setAnchorEl(null)
            }}
          >
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText>{label}</ListItemText>
            {mode === value && <CheckIcon fontSize="small" sx={{ ml: 1 }} />}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
