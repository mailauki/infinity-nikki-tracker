'use client'

import { useState } from 'react'
import { Box, Button, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import PaletteIcon from '@mui/icons-material/Palette'
import ShareIcon from '@mui/icons-material/Share'
import BrushIcon from '@mui/icons-material/Brush'

const FEATURES = [
  {
    icon: <PaletteIcon fontSize="small" />,
    label: 'Color themes',
    description: 'Moonlight, Cherry Blossom, and Forest color palettes',
  },
  {
    icon: <ShareIcon fontSize="small" />,
    label: 'Shareable profile',
    description: 'Public collection page at /u/your-username',
  },
  {
    icon: <BrushIcon fontSize="small" />,
    label: 'Custom Looks',
    description: 'Mix eureka and outfit pieces into named looks — unlimited for supporters',
  },
]

export default function PremiumUpgrade() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <Card
      sx={{
        background: 'linear-gradient(135deg, surface.containerLow, surface.container)',
        border: '1px solid',
        borderColor: 'primary.main',
        borderRadius: 3,
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon color="primary" />
            <Typography variant="subtitle1">Supporter upgrade</Typography>
            <Chip color="primary" label="One-time" size="small" />
          </Stack>

          <Typography color="textSecondary" variant="body2">
            Support the tracker with a one-time purchase and unlock cosmetic extras. No
            subscriptions, no game content — just app features built for you.
          </Typography>

          <Divider />

          <Stack spacing={1.5}>
            {FEATURES.map(({ icon, label, description }) => (
              <Stack key={label} direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                <Box sx={{ color: 'primary.main', mt: 0.25 }}>{icon}</Box>
                <Stack spacing={0}>
                  <Typography variant="body2">{label}</Typography>
                  <Typography color="textSecondary" variant="caption">
                    {description}
                  </Typography>
                </Stack>
              </Stack>
            ))}
          </Stack>

          {error && (
            <Typography color="error" variant="caption">
              {error}
            </Typography>
          )}

          <Button
            fullWidth
            color="primary"
            disabled={loading}
            startIcon={<AutoAwesomeIcon />}
            variant="contained"
            onClick={handleUpgrade}
          >
            {loading ? 'Redirecting…' : 'Upgrade — $5 one-time'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}
