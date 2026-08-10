'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material'
import { Category } from '@mui/icons-material'
import LazyImage from '@/components/lazy-image'
import type { UnassignedPiece } from '@/hooks/data/admin/gap-containers'

const PAGE_SIZE = 10

type UnassignedGap = 'image' | 'title'

const GAPS: { kind: UnassignedGap; label: string }[] = [
  { kind: 'image', label: 'No image' },
  { kind: 'title', label: 'No title' },
]

function gapPredicate(kind: UnassignedGap): (p: UnassignedPiece) => boolean {
  return kind === 'image' ? (p) => p.missingImage : (p) => p.missingTitle
}

export default function AdminUnassignedPieces({ pieces }: { pieces: UnassignedPiece[] }) {
  const [gap, setGap] = useState<UnassignedGap>('image')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => pieces.filter(gapPredicate(gap)), [pieces, gap])

  const total = filtered.length
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE))
  // Clamp during render instead of a useState+useEffect pair — a gap switch
  // can strand `page` past the new, shorter list.
  const currentPage = Math.min(page, lastPage)
  const from = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const to = Math.min(currentPage * PAGE_SIZE, total)
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function handleGapChange(next: UnassignedGap) {
    setGap(next)
    setPage(1)
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
          <Typography component="p" variant="overline">
            Unassigned pieces
          </Typography>
        </Box>
        <Typography color="text.secondary" sx={{ mb: 1.5 }} variant="body2">
          Pieces that belong to no set — each is edited on its own variant form,
          not through a set&apos;s.
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
          {GAPS.map(({ kind, label }) => {
            const count = pieces.filter(gapPredicate(kind)).length
            return (
              <Chip
                key={kind}
                color={kind === gap ? 'primary' : 'default'}
                label={`${label} ${count.toLocaleString()}`}
                size="small"
                variant={kind === gap ? 'filled' : 'outlined'}
                onClick={() => handleGapChange(kind)}
              />
            )
          })}
        </Box>

        {rows.length === 0 ? (
          <Typography color="text.disabled" sx={{ py: 3, textAlign: 'center' }} variant="body2">
            No unassigned pieces need attention.
          </Typography>
        ) : (
          <>
            <List disablePadding>
              {rows.map((row, i) => (
                <Box key={row.key}>
                  <ListItem disablePadding>
                    <ListItemButton component={Link} href={row.editHref}>
                      <ListItemAvatar>
                        <LazyImage
                          alt={row.slug}
                          src={row.imageUrl ?? undefined}
                          sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
                        >
                          <Category fontSize="inherit" />
                        </LazyImage>
                      </ListItemAvatar>
                      <ListItemText
                        primary={row.title}
                        secondary={row.entityTitle}
                        slotProps={{
                          primary: { variant: 'body2', noWrap: true },
                          secondary: { variant: 'caption' },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                  {i < rows.length - 1 && <Divider component="li" variant="inset" />}
                </Box>
              ))}
            </List>

            <Box
              sx={{
                alignItems: 'center',
                display: 'flex',
                gap: 1,
                justifyContent: 'space-between',
                mt: 1.5,
              }}
            >
              <Typography color="text.secondary" variant="caption">
                {from}–{to} of {total.toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button disabled={currentPage <= 1} size="small" onClick={() => setPage(currentPage - 1)}>
                  Previous
                </Button>
                <Button
                  disabled={currentPage >= lastPage}
                  size="small"
                  onClick={() => setPage(currentPage + 1)}
                >
                  Next
                </Button>
              </Box>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  )
}
