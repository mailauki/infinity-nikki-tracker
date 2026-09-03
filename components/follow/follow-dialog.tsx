'use client'

import { Dialog, DialogContent, DialogTitle, Tab, Tabs } from '@mui/material'
import type { FollowProfile } from '@/lib/types/follows'
import FollowList, { type FollowTab } from './follow-list'

export type { FollowTab }

// The modal presentation of Connections. All of the list behavior lives in
// FollowList, shared with the profile page's Connections tab — this wrapper
// contributes the Dialog chrome and the MUI Tabs switch only.
export default function FollowDialog({
  open,
  onClose,
  tab,
  onTabChange,
  following,
  followers,
  viewerId,
  viewerFollowingIds,
  onFollowChange,
}: {
  open: boolean
  onClose: () => void
  tab: FollowTab
  onTabChange: (tab: FollowTab) => void
  following: FollowProfile[]
  followers: FollowProfile[]
  /** null when signed out — gates the row buttons. */
  viewerId: string | null
  /** Ids the VIEWER follows, so row buttons reflect their relationship. */
  viewerFollowingIds: Set<string>
  /** Fired when a row inside the dialog is followed/unfollowed, so the parent can adjust the viewer's own Following count. */
  onFollowChange?: (isNowFollowing: boolean) => void
}) {
  return (
    <Dialog fullWidth maxWidth="xs" open={open} onClose={onClose}>
      <DialogTitle>Connections</DialogTitle>
      <DialogContent>
        <Tabs sx={{ mb: 1 }} value={tab} onChange={(_, next: FollowTab) => onTabChange(next)}>
          <Tab label="Following" value="following" />
          <Tab label="Followers" value="followers" />
        </Tabs>

        <FollowList
          followers={followers}
          following={following}
          tab={tab}
          viewerFollowingIds={viewerFollowingIds}
          viewerId={viewerId}
          onFollowChange={onFollowChange}
        />
      </DialogContent>
    </Dialog>
  )
}
