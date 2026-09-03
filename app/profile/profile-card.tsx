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
import { Edit, Person, Verified } from '@mui/icons-material'
import Link from 'next/link'
import LazyImage from '@/components/lazy-image'
import { COLOR_THEME_PRESETS } from '@/lib/theme-presets'
import { useColorTheme } from '@/components/color-theme-context'
import FollowButton from '@/components/follow/follow-button'
import FollowCountsRow from '@/components/follow/follow-counts'
import { useProfileTabs } from './profile-tabs-context'

// Shipped hero art, used when a profile has no banner of its own. Exported so
// the settings banner picker previews the same fallback the card renders.
export const DEFAULT_BANNER = '/banner.webp'

export default function ProfileCard({
  displayName,
  username,
  avatar_url,
  banner_url,
  loadError,
  isPremium,
  isOwner = false,
  stats,
  profileId,
  followingCount = 0,
  isFollowing = false,
  viewerId = null,
}: {
  displayName: string | null
  username: string | null
  avatar_url: string | null
  /** Profile banner. Falls back to the default hero art when null. */
  banner_url?: string | null
  loadError: boolean
  isPremium?: boolean
  /** The viewer owns this profile — swaps Follow for an edit affordance. */
  isOwner?: boolean
  /** Collection stat row, overlaid inside the gradient beneath the name. */
  stats?: React.ReactNode
  /** This profile's id — the Follow button's target. */
  profileId: string
  followingCount?: number
  /** Whether the viewer already follows this profile. */
  isFollowing?: boolean
  /** null when signed out. */
  viewerId?: string | null
}) {
  const theme = useTheme()
  const { colorTheme } = useColorTheme()

  // The card only shows a Following count, which the viewer following THIS
  // profile does not change — so the Follow button needs no count wiring here.
  const { setTab, setConnectionsView } = useProfileTabs()

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
      surface="base"
      sx={{ position: 'relative', borderRadius: 0, height: '100%', overflow: 'hidden', mx: 1 }}
    >
      {/* The hero fills the card rather than driving its height, so the card can
          stretch to the viewport. Absolutely positioned so LazyImage's media path
          keeps its skeleton + native lazy-load while covering the whole box. */}
      <Box sx={{ position: 'absolute', inset: 0 }}>
        <LazyImage
          image={banner_url || DEFAULT_BANNER}
          kind="media"
          // Center the crop so a tall banner keeps its middle in frame rather
          // than anchoring to the top edge as object-fit: cover defaults to.
          sx={{ width: '100%', height: '100%', '& img': { objectPosition: 'center' } }}
        />
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
            // The owner gets a working edit link; visitors get the live
            // Follow button.
            isOwner ? (
              <Button
                component={Link}
                endIcon={<Edit />}
                href="/settings"
                size="large"
                sx={{ borderRadius: 40, whiteSpace: 'nowrap' }}
                variant="contained"
              >
                Edit profile
              </Button>
            ) : (
              <FollowButton
                isFollowing={isFollowing}
                isLoggedIn={Boolean(viewerId)}
                size="large"
                targetId={profileId}
              />
            )
          }
          subheader={
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography color="textSecondary" component="span" size="large" variant="body">
                @{username ?? '—'}
              </Typography>
              <FollowCountsRow
                followingCount={followingCount}
                onOpenConnections={(view) => {
                  setConnectionsView(view)
                  setTab('connections')
                }}
              />
            </Stack>
          }
          // A long display name wraps to two lines on narrow screens; without this
          // the default action margins push the button out of line beside it.
          sx={{ '& .MuiCardHeader-action': { alignSelf: 'center', m: 0 } }}
          title={
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography component="span" variant="headline">
                {displayName ?? '—'}
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

        {stats && <Box sx={{ px: 2, pb: 12 }}>{stats}</Box>}
      </Stack>
    </Card>
  )
}
