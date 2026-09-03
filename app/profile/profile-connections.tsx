'use client'

import FollowList from '@/components/follow/follow-list'
import type { FollowProfile } from '@/lib/types/follows'
import { useProfileTabs } from './profile-tabs-context'

// The Connections tab body. The Following/Followers switch lives in the sticky
// bar (ProfileStatsBar), so this reads the active direction from context rather
// than rendering tabs of its own.
//
// The card's Following count is NOT reconciled from here: it sits on the Profile
// tab, a sibling behind a `hidden` boundary. Following someone from this list
// updates that row's own button immediately; the card's count catches up on
// reload.
export default function ProfileConnections({
  following,
  followers,
  viewerId,
  viewerFollowingIds,
}: {
  following: FollowProfile[]
  followers: FollowProfile[]
  /** null when signed out — gates the row buttons. */
  viewerId: string | null
  /** Ids the VIEWER follows, so row buttons reflect their relationship. */
  viewerFollowingIds: Set<string>
}) {
  const { connectionsView } = useProfileTabs()

  return (
    <FollowList
      followers={followers}
      following={following}
      tab={connectionsView}
      viewerFollowingIds={viewerFollowingIds}
      viewerId={viewerId}
    />
  )
}
