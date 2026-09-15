'use client'

import Link from 'next/link'
import {
  Box,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'

import ObtainedToggle from '@/components/search/obtained-toggle'
import { destinationFor } from '@/lib/search/routing'
import { isCollectible } from '@/lib/search/obtained'
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
              {/* The full match count for this kind, not the per-section
                  display limit -- limitPerKind must never hide how much
                  actually matched.

                  Deliberately NOT suffixed with `+` when the overall result
                  set hits SEARCH_RESULT_LIMIT. Hitting the global cap does not
                  mean THIS section was truncated, so the suffix was wrong on
                  every section but the last; and beside a list the modal caps
                  at 5, "5+" reads as "more than 5 shown here" rather than
                  "more than 5 matched". An exact count that is occasionally a
                  lower bound beats a qualifier that misleads on every row. */}
              <Chip label={matches.length} size="small" />
            </Stack>

            <List dense disablePadding>
              {shown.map((match) => {
                const href = destinationFor(match, facets)
                if (!href) return null

                const showToggle = isCollectible(match) && match.obtained !== null

                return (
                  <ListItem
                    key={`${match.kind}-${match.slug}`}
                    disablePadding
                    secondaryAction={showToggle ? <ObtainedToggle result={match} /> : null}
                  >
                    <ListItemButton component={Link} href={href} onClick={onNavigate}>
                      <ListItemText primary={match.title} secondary={match.subtitle} />
                    </ListItemButton>
                  </ListItem>
                )
              })}
            </List>
          </Box>
        )
      })}
    </Box>
  )
}
