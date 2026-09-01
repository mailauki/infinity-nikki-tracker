'use client'

import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import PaletteIcon from '@mui/icons-material/Palette'
import ImageIcon from '@mui/icons-material/Image'
import BrushIcon from '@mui/icons-material/Brush'

const FEATURES = [
  {
    icon: <PaletteIcon fontSize="small" />,
    label: 'Color themes',
    description: 'Moonlight, Cherry Blossom, and Forest color palettes',
  },
  {
    icon: <ImageIcon fontSize="small" />,
    label: 'Profile banner',
    description: 'Upload a custom banner image for your profile',
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
            <Typography size="large" variant="title">
              Supporter upgrade
            </Typography>
            <Chip color="primary" label="One-time" size="small" />
          </Stack>

          <Typography color="textSecondary" variant="body">
            Support the tracker with a one-time purchase and unlock cosmetic extras. No
            subscriptions, no ads, no game content — just app features built for you.
          </Typography>

          <Divider />

          <List disablePadding>
            {FEATURES.map(({ icon, label, description }) => (
              <ListItem key={label} disablePadding>
                <ListItemIcon>{icon}</ListItemIcon>
                <ListItemText primary={label} secondary={description} />
              </ListItem>
            ))}
          </List>

          {error && (
            <Typography color="error" size="small" variant="body">
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
            {loading ? 'Redirecting…' : 'Upgrade — $2 one-time'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}
