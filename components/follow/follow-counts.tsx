'use client'

import { useEffect, useState } from 'react'
import { Button, Stack, Typography } from '@mui/material'
import type { FollowProfile } from '@/lib/types/follows'
import FollowDialog, { type FollowTab } from './follow-dialog'

// Buttons styled as text rather than a clickable Typography: a Typography is
// neither keyboard-focusable nor announced as a control.
const COUNT_SX = {
  color: 'secondary.main',
  minWidth: 0,
  p: 0,
  textTransform: 'none',
  whiteSpace: 'nowrap',
  '&:hover': { background: 'none', textDecoration: 'underline' },
}

export default function FollowCountsRow({
  following,
  followers,
  followingCount,
  followersCount,
  viewerId,
  viewerFollowingIds,
  profileId,
  followerDelta = 0,
}: {
  following: FollowProfile[]
  followers: FollowProfile[]
  followingCount: number
  followersCount: number
  viewerId: string | null
  viewerFollowingIds: Set<string>
  /** This profile's id — needed to tell whether a dialog row toggle is the viewer's own Following count. */
  profileId?: string
  /**
   * +1/-1 from the sibling FollowButton on the profile card (see ProfileCard),
   * which follows/unfollows THIS profile and so isn't visible from inside
   * this component. Added on top of followersN for display.
   */
  followerDelta?: number
}) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<FollowTab>('following')

  // Counts start as optimistic local state seeded from the server-fetched
  // props, since this feature deliberately has no revalidatePath (see plan).
  const [followingN, setFollowingN] = useState(followingCount)
  const [followersN, setFollowersN] = useState(followersCount)

  // The component can stay mounted across a client navigation to a different
  // profile (new props, same instance), so re-seed local state whenever the
  // server-fetched counts change underneath it.
  useEffect(() => {
    setFollowingN(followingCount)
  }, [followingCount])
  useEffect(() => {
    setFollowersN(followersCount)
  }, [followersCount])

  const openOn = (next: FollowTab) => {
    setTab(next)
    setOpen(true)
  }

  // Rows inside the dialog are people the VIEWER follows/unfollows, which
  // changes the VIEWER's own "Following" count — NOT this profile's. Only
  // apply it here when the profile being viewed is the viewer's own profile
  // (viewerId === profileId); on someone else's profile, following a person
  // listed in their modal must NOT move that profile's Following number.
  const handleDialogFollowChange = (isNowFollowing: boolean) => {
    if (!profileId || viewerId !== profileId) return
    setFollowingN((count) => count + (isNowFollowing ? 1 : -1))
  }

  return (
    <>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Button disableRipple sx={COUNT_SX} onClick={() => openOn('following')}>
          <Typography component="span" size="small" variant="body">
            <strong>{followingN}</strong> Following
          </Typography>
        </Button>
        <Button disableRipple sx={COUNT_SX} onClick={() => openOn('followers')}>
          <Typography component="span" size="small" variant="body">
            <strong>{followersN + followerDelta}</strong> Followers
          </Typography>
        </Button>
      </Stack>

      <FollowDialog
        followers={followers}
        following={following}
        open={open}
        tab={tab}
        viewerFollowingIds={viewerFollowingIds}
        viewerId={viewerId}
        onClose={() => setOpen(false)}
        onFollowChange={handleDialogFollowChange}
        onTabChange={setTab}
      />
    </>
  )
}
