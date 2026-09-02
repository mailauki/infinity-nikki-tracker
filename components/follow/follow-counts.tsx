'use client'

import { useState } from 'react'
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
}: {
  following: FollowProfile[]
  followers: FollowProfile[]
  followingCount: number
  followersCount: number
  viewerId: string | null
  viewerFollowingIds: Set<string>
}) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<FollowTab>('following')

  const openOn = (next: FollowTab) => {
    setTab(next)
    setOpen(true)
  }

  return (
    <>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Button disableRipple sx={COUNT_SX} onClick={() => openOn('following')}>
          <Typography component="span" size="small" variant="body">
            <strong>{followingCount}</strong> Following
          </Typography>
        </Button>
        <Button disableRipple sx={COUNT_SX} onClick={() => openOn('followers')}>
          <Typography component="span" size="small" variant="body">
            <strong>{followersCount}</strong> Followers
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
        onTabChange={setTab}
      />
    </>
  )
}
