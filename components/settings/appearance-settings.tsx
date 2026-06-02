'use client'

import { useEffect, startTransition } from 'react'
import { Container, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import BrightnessMediumIcon from '@mui/icons-material/BrightnessMedium'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { useColorScheme } from '@mui/material/styles'
import { updateTheme } from '@/app/actions/preferences'

const modes = [
  { value: 'system', label: 'System', icon: <BrightnessMediumIcon fontSize="small" /> },
  { value: 'light', label: 'Light', icon: <LightModeIcon fontSize="small" /> },
  { value: 'dark', label: 'Dark', icon: <DarkModeIcon fontSize="small" /> },
] as const

export default function AppearanceSettings() {
  const { mode, setMode } = useColorScheme()

  useEffect(() => {
    fetch('/api/preferences')
      .then((res) => res.json())
      .then((prefs) => {
        const validThemes = ['system', 'light', 'dark'] as const
        const saved = prefs.theme
        if (
          saved &&
          (validThemes as readonly string[]).includes(saved) &&
          saved !== (mode ?? 'system')
        ) {
          setMode(saved as 'system' | 'light' | 'dark')
        }
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
	<Container maxWidth='sm' sx={{ mx: 0 }}>
    <Stack spacing={2}>
      <Typography variant="subtitle1">Theme</Typography>
      <ToggleButtonGroup
        exclusive
        aria-label="theme"
        value={mode ?? 'system'}
        onChange={(_, value) => {
          if (!value) return
          setMode(value)
          startTransition(() => updateTheme(value))
        }}
      >
        {modes.map(({ value, label, icon }) => (
          <ToggleButton key={value} aria-label={label} sx={{ gap: 1, px: 2 }} value={value}>
            {icon}
            {label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
		</Container>
  )
}
