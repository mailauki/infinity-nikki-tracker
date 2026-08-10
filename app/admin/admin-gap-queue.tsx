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
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
import { Add, Category } from '@mui/icons-material'
import LazyImage from '@/components/lazy-image'
import {
  ADMIN_ENTITIES,
  ADMIN_ENTITY_KEYS,
  type AdminEntityKey,
  type GapKind,
} from '@/lib/admin-entities'
import type { GapWorkItem } from '@/hooks/data/admin/gap-containers'
import type { AdminStat } from '@/hooks/data/admin/stats'

const PAGE_SIZE = 10

const GAPS: { kind: GapKind; label: string }[] = [
  { kind: 'image', label: 'No image' },
  { kind: 'title', label: 'No title' },
  { kind: 'description', label: 'No description' },
]

function gapCount(stat: AdminStat | undefined, kind: GapKind): number | null {
  if (!stat) return null
  if (kind === 'image') return stat.noImage
  if (kind === 'title') return stat.noTitle
  if (kind === 'description') return stat.noDescription
  return null
}

/** Default to the largest entity that actually has gaps, so the queue opens on real work. */
function defaultEntity(stats: AdminStat[]): AdminEntityKey {
  return [...stats].sort((a, b) => b.gaps - a.gaps)[0]?.key ?? 'outfit-variants'
}

/** Compact "2 title, 1 image" summary of a container's gap counts. */
function gapSummary(row: GapWorkItem): string {
  const parts: string[] = []
  if (row.noTitle > 0) parts.push(`${row.noTitle.toLocaleString()} title`)
  if (row.noImage > 0) parts.push(`${row.noImage.toLocaleString()} image`)
  if (row.noDescription > 0) parts.push(`${row.noDescription.toLocaleString()} desc`)
  return parts.join(', ') || 'no gaps'
}

export default function AdminGapQueue({
  items,
  stats,
}: {
  items: Record<AdminEntityKey, GapWorkItem[]>
  stats: AdminStat[]
}) {
  const [entity, setEntity] = useState<AdminEntityKey>(() => defaultEntity(stats))
  const [gap, setGap] = useState<GapKind>('image')
  const [page, setPage] = useState(1)

  const e = ADMIN_ENTITIES[entity]
  const stat = stats.find((s) => s.key === entity)

  const filtered = useMemo(() => {
    const all = items[entity] ?? []
    if (gap === 'image') return all.filter((r) => r.noImage > 0)
    if (gap === 'title') return all.filter((r) => r.noTitle > 0)
    if (gap === 'description') return all.filter((r) => r.noDescription > 0)
    // Duplicate detection has no signal on GapWorkItem (containers are unique
    // by slug already) — keep the chip for parity, but it never has rows.
    return []
  }, [items, entity, gap])

  const total = filtered.length
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE))
  // Clamp during render instead of a useState+useEffect pair — an entity/gap
  // switch can strand `page` past the new, shorter list.
  const currentPage = Math.min(page, lastPage)
  const from = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const to = Math.min(currentPage * PAGE_SIZE, total)
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function handleEntityChange(next: AdminEntityKey) {
    setEntity(next)
    setPage(1)
  }

  function handleGapChange(next: GapKind) {
    setGap(next)
    setPage(1)
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          <Typography component="p" variant="overline">
            Needs attention
          </Typography>
          <Box sx={{ ml: 'auto' }} />
          {/* All 12 entities listed — confirming an entity is clean is worth doing. */}
          <TextField
            select
            label="Entity"
            size="small"
            sx={{ minWidth: 200 }}
            value={entity}
            onChange={(ev) => handleEntityChange(ev.target.value as AdminEntityKey)}
          >
            {ADMIN_ENTITY_KEYS.map((key) => (
              <MenuItem key={key} value={key}>
                {ADMIN_ENTITIES[key].title}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
          {GAPS.map(({ kind, label }) => {
            // Hide a filter the entity cannot have.
            if (kind === 'image' && !e.tracksImage) return null
            if (kind === 'title' && !e.tracksTitle) return null
            if (kind === 'description' && !e.tracksDescription) return null
            // Duplicate detection returns with the alt_slug work. It was removed
            // here because container rows (GapWorkItem) carry no duplicate signal.
            const count = gapCount(stat, kind)
            return (
              <Chip
                key={kind}
                color={kind === gap ? 'primary' : 'default'}
                label={count === null ? label : `${label} ${count.toLocaleString()}`}
                size="small"
                sx={kind === 'description' ? { borderStyle: 'dashed', opacity: 0.7 } : undefined}
                variant={kind === gap ? 'filled' : 'outlined'}
                onClick={() => handleGapChange(kind)}
              />
            )
          })}
          {e.addHref && (
            <Button
              component="a"
              href={e.addHref}
              size="small"
              startIcon={<Add />}
              sx={{ ml: 'auto' }}
            >
              Add
            </Button>
          )}
        </Box>

        {rows.length === 0 ? (
          <Typography color="text.disabled" sx={{ py: 3, textAlign: 'center' }} variant="body2">
            Nothing needs attention in {e.title}.
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
                        secondary={`${row.kind} · ${gapSummary(row)}`}
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
