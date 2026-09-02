'use client'

import { useState, useTransition } from 'react'
import { Button } from '@mui/material'
import { Add, Check } from '@mui/icons-material'
import { enqueueSnackbar } from 'notistack'
import { followUser, unfollowUser } from '@/lib/follow-actions'

export default function FollowButton({
  targetId,
  isFollowing = false,
  isSelf = false,
  isLoggedIn = false,
  size = 'small',
  onChange,
}: {
  targetId: string
  isFollowing?: boolean
  /** The row is the viewer's own profile — there is nothing to follow. */
  isSelf?: boolean
  isLoggedIn?: boolean
  size?: 'small' | 'medium' | 'large'
  /** Fired with the new state so a parent can adjust its counts optimistically. */
  onChange?: (following: boolean) => void
}) {
  const [following, setFollowing] = useState(isFollowing)
  const [pending, startTransition] = useTransition()

  // Signed-out visitors and the viewer's own row get no control at all, rather
  // than a dead disabled one.
  if (isSelf || !isLoggedIn) return null

  const handleClick = () => {
    const next = !following

    // Optimistic: flip immediately, revert if the write fails.
    setFollowing(next)
    onChange?.(next)

    startTransition(async () => {
      try {
        await (next ? followUser(targetId) : unfollowUser(targetId))
      } catch {
        setFollowing(!next)
        onChange?.(!next)
        enqueueSnackbar(next ? 'Could not follow' : 'Could not unfollow', { variant: 'error' })
      }
    })
  }

  return (
    <Button
      disabled={pending}
      endIcon={following ? <Check /> : <Add />}
      size={size}
      sx={{ borderRadius: 40, whiteSpace: 'nowrap' }}
      variant={following ? 'outlined' : 'contained'}
      onClick={handleClick}
    >
      {following ? 'Following' : 'Follow'}
    </Button>
  )
}
