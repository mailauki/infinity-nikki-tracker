'use client'

import { useEffect, useState, startTransition } from 'react'
import {
  Box,
  Card,
  CardActionArea,
  Container,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import BrightnessMediumIcon from '@mui/icons-material/BrightnessMedium'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import LockIcon from '@mui/icons-material/Lock'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useColorScheme } from '@mui/material/styles'
import {
  updateTheme,
  updateColorTheme,
  updateSortDir,
  updateTextScale,
} from '@/app/actions/preferences'
import { COLOR_THEME_PRESETS } from '@/lib/theme-presets'
import { useColorTheme } from '@/components/color-theme-context'
import type { SortOrder } from '@/components/sort-context'
import type { ColorTheme } from '@/lib/types/eureka'
import { TEXT_SCALES, TEXT_SCALE_LABELS, toTextScale, type TextScale } from '@/lib/text-scale'

const modes = [
  { value: 'system', label: 'System', icon: <BrightnessMediumIcon fontSize="small" /> },
  { value: 'light', label: 'Light', icon: <LightModeIcon fontSize="small" /> },
  { value: 'dark', label: 'Dark', icon: <DarkModeIcon fontSize="small" /> },
] as const

const COLOR_THEMES: ColorTheme[] = ['default', 'moonlight', 'blossom', 'forest']

export default function AppearanceSettings({
  isPremium,
  isLoggedIn = false,
}: {
  isPremium: boolean
  isLoggedIn?: boolean
}) {
  const { mode, setMode } = useColorScheme()
  const { colorTheme, setColorTheme, textScale, setTextScale } = useColorTheme()
  const [sortOrder, setSortOrder] = useState<SortOrder>('new')

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
        setTextScale(toTextScale(prefs.text_scale))
        // Accept both the legacy 'new'/'old' and the new 'asc'/'desc' shapes.
        if (prefs.sort_order === 'new' || prefs.sort_order === 'desc') setSortOrder('new')
        else if (prefs.sort_order === 'old' || prefs.sort_order === 'asc') setSortOrder('old')
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSortChange(value: SortOrder) {
    setSortOrder(value)
    // sort_order is the date direction: 'new' = newest first (desc), 'old' = asc.
    startTransition(() => updateSortDir(value === 'new' ? 'desc' : 'asc'))
  }

  function handleTextScaleChange(value: TextScale) {
    setTextScale(value)
    startTransition(() => updateTextScale(value))
  }

  async function handleColorThemeChange(value: ColorTheme) {
    if (!isPremium && value !== 'default') return
    setColorTheme(value)
    startTransition(() => updateColorTheme(value))
  }

  return (
    <Container maxWidth="sm" sx={{ mx: 0 }}>
      <Stack spacing={3}>
        <Stack spacing={2}>
          <Typography size="large" variant="title">
            Mode
          </Typography>
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

        <Stack spacing={2}>
          <Typography size="large" variant="title">
            Text Size
          </Typography>
          <ToggleButtonGroup
            exclusive
            aria-label="text size"
            value={textScale}
            onChange={(_, value) => {
              if (!value) return
              handleTextScaleChange(value as TextScale)
            }}
          >
            {TEXT_SCALES.map((scale) => (
              <ToggleButton
                key={scale}
                aria-label={TEXT_SCALE_LABELS[scale]}
                sx={{ px: 2 }}
                value={scale}
              >
                {TEXT_SCALE_LABELS[scale]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Typography color="textSecondary" size="small" variant="body">
            Scales text across the whole app, including collection grids and filters.
          </Typography>
        </Stack>

        {isLoggedIn && (
          <Stack spacing={2}>
            <Typography size="large" variant="title">
              Default Sort
            </Typography>
            <ToggleButtonGroup
              exclusive
              aria-label="default sort order"
              value={sortOrder}
              onChange={(_, value) => {
                if (!value) return
                handleSortChange(value)
              }}
            >
              <ToggleButton aria-label="Newest first" sx={{ px: 2 }} value="new">
                Newest first
              </ToggleButton>
              <ToggleButton aria-label="Oldest first" sx={{ px: 2 }} value="old">
                Oldest first
              </ToggleButton>
            </ToggleButtonGroup>
            <Typography color="textSecondary" size="small" variant="body">
              Applies to the Eureka and Outfits collection views.
            </Typography>
          </Stack>
        )}

        <Stack spacing={2}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <Typography size="large" variant="title">
              Color Theme
            </Typography>
            {!isPremium && (
              <Typography color="primary" size="small" variant="body">
                Premium
              </Typography>
            )}
          </Stack>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 1.5,
            }}
          >
            {COLOR_THEMES.map((key) => {
              const preset = COLOR_THEME_PRESETS[key]
              const isSelected = colorTheme === key
              const isLocked = !isPremium && key !== 'default'
              return (
                <Card
                  key={key}
                  sx={{
                    outline: isSelected ? '2px solid' : '1px solid',
                    outlineColor: isSelected ? 'primary.main' : 'divider',
                    opacity: isLocked ? 0.5 : 1,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <CardActionArea
                    disabled={isLocked}
                    sx={{ p: 1.5 }}
                    onClick={() => handleColorThemeChange(key)}
                  >
                    <Stack spacing={1}>
                      <Stack direction="row" sx={{ gap: 0.5 }}>
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            backgroundColor: preset.light.primary,
                          }}
                        />
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            backgroundColor: preset.light.secondary,
                          }}
                        />
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            backgroundColor: preset.light.tertiary,
                          }}
                        />
                      </Stack>
                      <Typography variant="title">{preset.label}</Typography>
                      <Typography color="textSecondary" size="small" variant="body">
                        {preset.description}
                      </Typography>
                    </Stack>
                    {isSelected && (
                      <CheckCircleIcon
                        color="primary"
                        fontSize="small"
                        sx={{ position: 'absolute', top: 8, right: 8 }}
                      />
                    )}
                    {isLocked && (
                      <LockIcon
                        color="action"
                        fontSize="small"
                        sx={{ position: 'absolute', top: 8, right: 8 }}
                      />
                    )}
                  </CardActionArea>
                </Card>
              )
            })}
          </Box>
          {!isPremium && (
            <Typography color="textSecondary" size="small" variant="body">
              Unlock additional color themes with a one-time premium upgrade.
            </Typography>
          )}
        </Stack>
      </Stack>
    </Container>
  )
}
