'use client'

import Link from 'next/link'
import { Box, Chip, List, ListItemButton, ListItemText, Stack, Typography } from '@mui/material'

import { destinationFor } from '@/lib/search/routing'
import { KIND_LABELS, SEARCH_KINDS, type SearchFacet, type SearchResult } from '@/lib/search/types'

export default function SearchResults({
  results,
  facets = [],
  limitPerKind,
  onNavigate,
}: {
  results: SearchResult[]
  facets?: SearchFacet[]
  limitPerKind?: number
  onNavigate?: () => void
}) {
  if (results.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography sx={{ color: 'text.secondary' }} variant="body">
          No results found.
        </Typography>
      </Box>
    )
  }

  // Grouped in SEARCH_KINDS order rather than by rank, so section order is
  // stable as the user types instead of reshuffling on every keystroke.
  const sections = SEARCH_KINDS.map((kind) => ({
    kind,
    matches: results.filter((r) => r.kind === kind),
  })).filter((section) => section.matches.length > 0)

  return (
    <Box>
      {sections.map(({ kind, matches }) => {
        const shown = limitPerKind ? matches.slice(0, limitPerKind) : matches

        return (
          <Box key={kind} sx={{ mb: 2 }}>
            <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 1, px: 2, py: 1 }}>
              <Typography component="h2" sx={{ color: 'text.secondary' }} variant="label">
                {KIND_LABELS[kind]}
              </Typography>
              {/* The true match count, not the capped one -- the cap must
                  never hide how much actually matched. */}
              <Chip label={matches.length} size="small" />
            </Stack>

            <List dense disablePadding>
              {shown.map((match) => {
                const href = destinationFor(match, facets)
                if (!href) return null

                return (
                  <ListItemButton
                    key={`${match.kind}-${match.slug}`}
                    component={Link}
                    href={href}
                    onClick={onNavigate}
                  >
                    <ListItemText primary={match.title} secondary={match.subtitle} />
                  </ListItemButton>
                )
              })}
            </List>
          </Box>
        )
      })}
    </Box>
  )
}
