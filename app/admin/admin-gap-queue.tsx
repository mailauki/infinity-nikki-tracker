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
import { Add, Category } from '@mui/icons-material'
import Link from 'next/link'
import LazyImage from '@/components/lazy-image'
import { getGapRows, GAP_PAGE_SIZE } from '@/hooks/data/admin/gaps'
import { ADMIN_ENTITIES, type AdminEntityKey, type GapKind } from '@/lib/admin-entities'
import { buildDashboardHref } from '@/lib/admin-routes'
import type { AdminStat } from '@/hooks/data/admin/stats'
import AdminGapEntitySelect from './admin-gap-entity-select'

const GAPS: { kind: GapKind; label: string }[] = [
  { kind: 'image', label: 'No image' },
  { kind: 'title', label: 'No title' },
  { kind: 'description', label: 'No description' },
  { kind: 'duplicate', label: 'Dupes' },
]

function gapCount(stat: AdminStat | undefined, kind: GapKind): number | null {
  if (!stat) return null
  if (kind === 'image') return stat.noImage
  if (kind === 'title') return stat.noTitle
  if (kind === 'description') return stat.noDescription
  return null
}

export default async function AdminGapQueue({
  stats,
  entity,
  gap,
  page,
}: {
  stats: AdminStat[]
  entity: AdminEntityKey
  gap: GapKind
  page: number
}) {
  const e = ADMIN_ENTITIES[entity]
  const stat = stats.find((s) => s.key === entity)
  const { rows, total } = await getGapRows({ entity, gap, page })

  const lastPage = Math.max(1, Math.ceil(total / GAP_PAGE_SIZE))
  const from = total === 0 ? 0 : (page - 1) * GAP_PAGE_SIZE + 1
  const to = Math.min(page * GAP_PAGE_SIZE, total)

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          <Typography component="p" variant="overline">
            Needs attention
          </Typography>
          <Box sx={{ ml: 'auto' }} />
          {/* All 12 entities listed — confirming an entity is clean is worth doing. */}
          <AdminGapEntitySelect entity={entity} gap={gap} />
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
          {GAPS.map(({ kind, label }) => {
            // Hide a filter the entity cannot have. Duplicates apply to variants only.
            if (kind === 'image' && !e.tracksImage) return null
            if (kind === 'title' && !e.tracksTitle) return null
            if (kind === 'description' && !e.tracksDescription) return null
            if (kind === 'duplicate' && !e.isVariant) return null
            const count = gapCount(stat, kind)
            return (
              <Chip
                key={kind}
                clickable
                color={kind === gap ? 'primary' : 'default'}
                component={Link}
                href={buildDashboardHref({ entity, gap: kind })}
                label={count === null ? label : `${label} ${count.toLocaleString()}`}
                size="small"
                sx={kind === 'description' ? { borderStyle: 'dashed', opacity: 0.7 } : undefined}
                variant={kind === gap ? 'filled' : 'outlined'}
              />
            )
          })}
          {e.addHref && (
            <Button
              component={Link}
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
                <Box key={row.slug}>
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
                        secondary={row.slug}
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
                <Button
                  component={Link}
                  disabled={page <= 1}
                  href={buildDashboardHref({ entity, gap, page: page - 1 })}
                  size="small"
                >
                  Previous
                </Button>
                <Button
                  component={Link}
                  disabled={page >= lastPage}
                  href={buildDashboardHref({ entity, gap, page: page + 1 })}
                  size="small"
                >
                  Next
                </Button>
                <Button
                  component={Link}
                  href={`${rows[0].editHref}?entity=${entity}&gap=${gap}&page=${page}`}
                  size="small"
                  variant="outlined"
                >
                  Start fixing
                </Button>
              </Box>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  )
}
