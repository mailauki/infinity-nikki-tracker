'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { Search } from '@mui/icons-material'
import { createClient } from '@/lib/supabase/client'
import { buildProfileSearchFilter, isSearchable } from '@/lib/follow-search'
import type { FollowProfile } from '@/lib/types/follows'
import FollowRow from './follow-row'

export type FollowTab = 'following' | 'followers'

const SEARCH_DEBOUNCE_MS = 300
const SEARCH_LIMIT = 20

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
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FollowProfile[]>([])
  const [searching, setSearching] = useState(false)

  // Local overlay of follow changes made inside the dialog, so a row's button
  // stays correct without refetching the whole list.
  const [changed, setChanged] = useState<Map<string, boolean>>(new Map())

  const trimmed = query.trim()
  const isSearching = trimmed.length > 0

  useEffect(() => {
    // A query of only structural characters escapes to empty, which would
    // otherwise become a bare wildcard matching every profile. This also
    // covers the empty-query case, since isSearchable('') is false.
    if (!isSearchable(trimmed)) {
      setResults([])
      setSearching(false)
      return
    }

    // Clear stale results from a prior query immediately, so the previous
    // list doesn't linger on screen through the debounce + round trip.
    setResults([])
    setSearching(true)
    let cancelled = false

    // Debounced: the search runs client-side per keystroke, so without this it
    // would issue a request per character.
    const timer = setTimeout(async () => {
      const supabase = createClient()
      let request = supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .or(buildProfileSearchFilter(trimmed))

      // Never offer the viewer their own profile as a follow target.
      if (viewerId) request = request.neq('id', viewerId)

      const { data } = await request.order('username').limit(SEARCH_LIMIT)

      if (cancelled) return
      setResults((data as FollowProfile[]) ?? [])
      setSearching(false)
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [trimmed, isSearching, viewerId])

  const handleFollowChange = (id: string, isFollowing: boolean) => {
    setChanged((prev) => new Map(prev).set(id, isFollowing))
    onFollowChange?.(isFollowing)
  }

  const isFollowingProfile = (id: string) => changed.get(id) ?? viewerFollowingIds.has(id)

  // Flattened out of a nested ternary: searching replaces the tab body wholesale,
  // otherwise the active tab picks its own list.
  function currentList() {
    if (isSearching) return results
    return tab === 'following' ? following : followers
  }

  const list = currentList()

  // Each branch names the state it describes, rather than nesting ternaries.
  function emptyStateMessage() {
    if (isSearching) return searching ? 'Searching…' : 'No profiles found'
    return tab === 'following' ? 'Not following anyone yet' : 'No followers yet'
  }

  const emptyMessage = emptyStateMessage()

  return (
    <Dialog fullWidth maxWidth="xs" open={open} onClose={onClose}>
      <DialogTitle>Connections</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          placeholder="Search profiles…"
          size="small"
          slotProps={{
            htmlInput: { 'aria-label': 'Search profiles' },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 1 }}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        {/* Tabs stay mounted while searching so clearing the query returns to
            the same tab the user left. */}
        <Tabs
          sx={{ mb: 1, visibility: isSearching ? 'hidden' : 'visible' }}
          value={tab}
          onChange={(_, next: FollowTab) => onTabChange(next)}
        >
          <Tab label="Following" value="following" />
          <Tab label="Followers" value="followers" />
        </Tabs>

        {list.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="textSecondary" component="p" variant="body">
              {emptyMessage}
            </Typography>
          </Box>
        ) : (
          <Stack>
            {list.map((profile) => (
              <FollowRow
                key={profile.id}
                isFollowing={isFollowingProfile(profile.id)}
                isLoggedIn={Boolean(viewerId)}
                isSelf={profile.id === viewerId}
                profile={profile}
                onFollowChange={handleFollowChange}
              />
            ))}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  )
}
