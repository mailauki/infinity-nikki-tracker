'use client'

import { Box, Stack, Typography } from '@mui/material'
import { Person } from '@mui/icons-material'
import Link from 'next/link'
import LazyImage from '@/components/lazy-image'
import type { FollowProfile } from '@/lib/types/follows'
import FollowButton from './follow-button'

// Hoisted: LazyImage is memo'd, so an inline sx object or fallback element
// silently defeats the memo on every render of a long list.
const AVATAR_FALLBACK = <Person fontSize="inherit" />
const ROW_SX = { alignItems: 'center', justifyContent: 'space-between', py: 1 }
const LINK_SX = { alignItems: 'center', flex: 1, minWidth: 0, textDecoration: 'none' }
const NAME_SX = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }

export default function FollowRow({
  profile,
  isFollowing = false,
  isSelf = false,
  isLoggedIn = false,
  onFollowChange,
}: {
  profile: FollowProfile
  isFollowing?: boolean
  isSelf?: boolean
  isLoggedIn?: boolean
  onFollowChange?: (profile: FollowProfile, following: boolean) => void
}) {
  return (
    <Stack direction="row" spacing={1} sx={ROW_SX}>
      <Stack
        component={Link}
        direction="row"
        href={`/u/${profile.username}`}
        spacing={1.5}
        sx={LINK_SX}
      >
        {/* size="sm" opts into the edge-resized thumbnail path. */}
        <LazyImage alt="" size="sm" src={profile.avatar_url} variant="circular">
          {AVATAR_FALLBACK}
        </LazyImage>
        <Box sx={{ minWidth: 0 }}>
          <Typography color="textPrimary" component="div" sx={NAME_SX} variant="body">
            {profile.display_name ?? profile.username ?? '—'}
          </Typography>
          <Typography
            color="textSecondary"
            component="div"
            size="small"
            sx={NAME_SX}
            variant="body"
          >
            @{profile.username ?? '—'}
          </Typography>
        </Box>
      </Stack>

      <FollowButton
        isFollowing={isFollowing}
        isLoggedIn={isLoggedIn}
        isSelf={isSelf}
        targetId={profile.id}
        onChange={(following) => onFollowChange?.(profile, following)}
      />
    </Stack>
  )
}
