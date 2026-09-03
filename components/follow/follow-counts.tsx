'use client'

import { useEffect, useState } from 'react'
import { Button, Stack } from '@mui/material'
import { Person } from '@mui/icons-material'

// The compact Following count on the profile card. Deliberately shows only the
// one number: both lists live on the profile's Connections tab now, and this is
// a shortcut into it rather than the place to read the stats. That is also why
// there is no followers count here — and so no followerDelta, which used to
// exist only to keep a followers number in step with the card's Follow button.
export default function FollowCountsRow({
  followingCount,
  onOpenConnections,
}: {
  followingCount: number
  /** Opens the profile's Connections tab on the given direction. */
  onOpenConnections?: (view: 'following' | 'followers') => void
}) {
  // Count starts as optimistic local state seeded from the server-fetched prop,
  // since this feature deliberately has no revalidatePath (see plan).
  const [followingN, setFollowingN] = useState(followingCount)

  // The component can stay mounted across a client navigation to a different
  // profile (new props, same instance), so re-seed local state whenever the
  // server-fetched count changes underneath it.
  useEffect(() => {
    setFollowingN(followingCount)
  }, [followingCount])

  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
      {/* aria-label names what the icon and bare number mean — on its own,
          "12" announces as nothing useful. */}
      <Button
        aria-label={`${followingN} following — view connections`}
        size="small"
        startIcon={<Person fontSize="small" />}
        onClick={() => onOpenConnections?.('following')}
      >
        {followingN}
      </Button>
    </Stack>
  )
}
