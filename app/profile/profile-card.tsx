'use client'

import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardHeader,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import { Add, Person, Verified } from '@mui/icons-material'
import Link from 'next/link'
import LazyImage from '@/components/lazy-image'
import { COLOR_THEME_PRESETS } from '@/lib/theme-presets'
import { useColorTheme } from '@/components/color-theme-context'

export default function ProfileCard({
  fullname,
  username,
  avatar_url,
  loadError,
  isPremium,
  stats,
}: {
  fullname: string | null
  username: string | null
  avatar_url: string | null
  loadError: boolean
  isPremium?: boolean
  /** Collection stat row, overlaid inside the gradient beneath the name. */
  stats?: React.ReactNode
}) {
  const theme = useTheme()
  const { colorTheme } = useColorTheme()

  const preset = COLOR_THEME_PRESETS[colorTheme]
  const gradient = (surface: string) =>
    `linear-gradient(to top, ${alpha(surface, 1)} 20%, ${alpha(surface, 0.7)} 70%, ${alpha(surface, 0.3)} 90%, ${alpha(surface, 0)} 100%)`
  const background = gradient(preset.light.surface.main)
  const darkBackground = gradient(preset.dark.surface.main)

  if (loadError) {
    return <Alert severity="error">Could not load your profile. Please refresh the page.</Alert>
  }

  return (
    <Card
      surface="main"
      sx={{ position: 'relative', borderRadius: 0, height: '100%', overflow: 'hidden', mx: 1 }}
    >
      {/* The hero fills the card rather than driving its height, so the card can
          stretch to the viewport. Absolutely positioned so LazyImage's media path
          keeps its skeleton + native lazy-load while covering the whole box. */}
      <Box sx={{ position: 'absolute', inset: 0 }}>
        <LazyImage image="/hero.webp" kind="media" sx={{ width: '100%', height: '100%' }} />
      </Box>

      <Stack
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          pt: 8,
          background,
          ...theme.applyStyles('dark', { background: darkBackground }),
        }}
      >
        <Stack sx={{ px: 2 }}>
          <LazyImage alt="Avatar" size="lg" src={avatar_url} variant="circular">
            <Person fontSize="inherit" />
          </LazyImage>
        </Stack>

        <CardHeader
          disableTypography
          action={
            <Button
              disabled
              component={Link}
              endIcon={<Add />}
              href="/settings"
              size="large"
              sx={{ borderRadius: 40, whiteSpace: 'nowrap' }}
              variant="contained"
            >
              Follow
            </Button>
          }
          subheader={
            <Typography color="textSecondary" component="span" variant="body1">
              @{username ?? '—'}
            </Typography>
          }
          // A long display name wraps to two lines on narrow screens; without this
          // the default action margins push the button out of line beside it.
          sx={{ '& .MuiCardHeader-action': { alignSelf: 'center', m: 0 } }}
          title={
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography component="span" variant="h5">
                {fullname ?? '—'}
              </Typography>
              {isPremium && (
                <Tooltip title="Verified supporter">
                  {/* `color="tertiary"` isn't in SvgIcon's color union (the theme
                      adds the palette entry, not the prop override), so reach for
                      the palette via sx — same as the collection charts do. */}
                  <Verified sx={{ color: 'tertiary.main' }} />
                </Tooltip>
              )}
            </Stack>
          }
        />

        {stats && <Box sx={{ px: 2, pb: 3 }}>{stats}</Box>}
      </Stack>
    </Card>
  )
}
