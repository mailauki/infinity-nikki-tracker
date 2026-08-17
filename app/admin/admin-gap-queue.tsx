'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Box,
  Button,
  Card,
  CardContent,
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
  STANDALONE_QUEUE_KEY,
  type AdminEntityKey,
  type GapKind,
  type GapQueueKey,
} from '@/lib/admin-entities'
// Type-only: this module imports the server-only Supabase client, so a value
// import here would pull it into the browser bundle.
import type { GapWorkItem } from '@/hooks/data/admin/gap-containers'
import type { AdminStat } from '@/hooks/data/admin/stats'
import { GapEmptyState, GapFilterChips, GapPaginationFooter } from './admin-gap-list-parts'

const PAGE_SIZE = 10

/**
 * What the queue needs to know about the selected bucket. Real entities read
 * this straight off ADMIN_ENTITIES; the synthetic standalone-pieces bucket
 * supplies its own, since it spans three tables and has no entity row.
 */
interface QueueBucket {
  title: string
  tracksTitle: boolean
  tracksImage: boolean
  tracksAltImage: boolean
  tracksDescription: boolean
  tracksSeason: boolean
  addHref?: string
}

/**
 * Standalone pieces are listed per-piece rather than per-set, so every gap
 * kind its three source tables track is available. Title/image/description
 * hold across all three; season does not apply to eureka_variants, but the
 * mixed list still shows the chip because outfit and makeup rows use it.
 */
const STANDALONE_BUCKET: QueueBucket = {
  title: 'Standalone Pieces',
  tracksTitle: true,
  tracksImage: true,
  tracksAltImage: true,
  tracksDescription: true,
  tracksSeason: true,
}

/**
 * Entities excluded from the queue dropdown. Season Categories and Abilities
 * are small lookup tables whose only tracked gap is a description nobody
 * fills in, so they were permanent noise in a list meant to show real work.
 * They remain in ADMIN_ENTITIES, so the totals strip and completeness list
 * still count them.
 */
const HIDDEN_QUEUE_KEYS = new Set<AdminEntityKey>(['season-categories', 'abilities'])

/** Ordered dropdown options — real entities, then the synthetic bucket. */
const QUEUE_KEYS: GapQueueKey[] = [
  ...ADMIN_ENTITY_KEYS.filter((key) => !HIDDEN_QUEUE_KEYS.has(key)),
  STANDALONE_QUEUE_KEY,
]

function queueBucket(key: GapQueueKey): QueueBucket {
  return key === STANDALONE_QUEUE_KEY ? STANDALONE_BUCKET : ADMIN_ENTITIES[key]
}

const GAPS: { kind: GapKind; label: string }[] = [
  { kind: 'image', label: 'No image' },
  { kind: 'alt-image', label: 'No alt image' },
  { kind: 'title', label: 'No title' },
  { kind: 'description', label: 'No description' },
  { kind: 'season', label: 'No season' },
  { kind: 'season-category', label: 'No season cat.' },
]

/**
 * Buckets whose rows are fetched with an image/title-only gate: the three
 * grouped-variant entities and the standalone-pieces bucket. Simple entities
 * gate on every tracked field instead (see `fetchSimpleGapItems` in
 * hooks/data/admin/gap-containers.ts).
 */
const PARTIALLY_GATED_BUCKETS = new Set<GapQueueKey>([
  'outfit-variants',
  'makeup-variants',
  'eureka-variants',
  STANDALONE_QUEUE_KEY,
])

/**
 * Whether a chip should render de-emphasized: true when its count describes a
 * subset of the bucket rather than every row. In partially-gated buckets the
 * description count only covers rows already pulled in by an image/title gap,
 * so it undercounts. Simple entities gate on every tracked field, making all
 * their chips exact.
 *
 * Season is the exception in grouped-variant buckets: it is counted by a
 * separate ungated pass, so those counts are exact even though inclusion is
 * not gated on it.
 */
function isNonGating(key: GapQueueKey, kind: GapKind): boolean {
  if (!PARTIALLY_GATED_BUCKETS.has(key)) return false
  if (kind === 'description') return true
  // Standalone pieces have no ungated season pass, so their season counts are
  // subset-scoped; grouped variants do, so theirs are exact.
  return key === STANDALONE_QUEUE_KEY && (kind === 'season' || kind === 'season-category')
}

/** Per-row count for a gap kind — the single place the kind→field mapping lives. */
function rowGapCount(row: GapWorkItem, kind: GapKind): number {
  if (kind === 'image') return row.noImage
  if (kind === 'alt-image') return row.noAltImage
  if (kind === 'title') return row.noTitle
  if (kind === 'description') return row.noDescription
  if (kind === 'season') return row.noSeason
  return row.noSeasonCategory
}

/**
 * Chip count for a gap kind, counted over the same containers the list below
 * renders — never the row-level `AdminStat` totals, which count variants, not
 * the containers this queue paginates.
 */
function containerGapCount(rows: GapWorkItem[], kind: GapKind): number {
  return rows.filter((r) => rowGapCount(r, kind) > 0).length
}

/**
 * Default to the largest entity that actually has gaps, so the queue opens on
 * real work. Sourced from `stats`, which covers real entities only — the
 * standalone bucket has no `admin_entity_stats` row and is never the default.
 */
function defaultEntity(stats: AdminStat[]): GapQueueKey {
  return (
    // Hidden entities are filtered out first: `stats` still carries them (they
    // remain in ADMIN_ENTITIES for the totals strip), and defaulting to one
    // would open the queue on an entity the dropdown cannot display.
    [...stats].filter((s) => !HIDDEN_QUEUE_KEYS.has(s.key)).sort((a, b) => b.gaps - a.gaps)[0]
      ?.key ?? 'outfit-variants'
  )
}

/** Compact "2 title, 1 image" summary of a container's gap counts. */
function gapSummary(row: GapWorkItem): string {
  const parts: string[] = []
  if (row.noTitle > 0) parts.push(`${row.noTitle.toLocaleString()} title`)
  if (row.noImage > 0) parts.push(`${row.noImage.toLocaleString()} image`)
  if (row.noAltImage > 0) parts.push(`${row.noAltImage.toLocaleString()} alt image`)
  if (row.noDescription > 0) parts.push(`${row.noDescription.toLocaleString()} desc`)
  if (row.noSeason > 0) parts.push(`${row.noSeason.toLocaleString()} season`)
  if (row.noSeasonCategory > 0) parts.push(`${row.noSeasonCategory.toLocaleString()} season cat.`)
  return parts.join(', ') || 'no gaps'
}

/** Whether a bucket renders a chip for this gap kind. */
function entityHasGapKind(entity: QueueBucket, kind: GapKind): boolean {
  if (kind === 'image') return entity.tracksImage
  if (kind === 'alt-image') return entity.tracksAltImage
  if (kind === 'title') return entity.tracksTitle
  if (kind === 'description') return entity.tracksDescription
  return entity.tracksSeason
}

/**
 * The gap kind actually in effect: the selected one when the bucket supports
 * it, else the first kind the bucket does support. Pure and module-level so
 * the React Compiler can see it has no unstable captures.
 */
function resolveGap(key: GapQueueKey, gap: GapKind): GapKind {
  const bucket = queueBucket(key)
  if (entityHasGapKind(bucket, gap)) return gap
  return GAPS.find(({ kind }) => entityHasGapKind(bucket, kind))?.kind ?? gap
}

export default function AdminGapQueue({
  items,
  stats,
}: {
  items: Record<GapQueueKey, GapWorkItem[]>
  stats: AdminStat[]
}) {
  const [entity, setEntity] = useState<GapQueueKey>(() => defaultEntity(stats))
  const [gap, setGap] = useState<GapKind>('image')
  const [page, setPage] = useState(1)

  const e = queueBucket(entity)

  // Resolve during render, like the `currentPage` clamp below: switching to an
  // entity that lacks the selected kind's column (e.g. "No season" → Trials)
  // hides that chip, which would otherwise strand `gap` on a hidden kind and
  // render an empty list with no chip active.
  const activeGap = resolveGap(entity, gap)

  const filtered = useMemo(
    () => (items[entity] ?? []).filter((r) => rowGapCount(r, resolveGap(entity, gap)) > 0),
    [items, entity, gap]
  )
  const allForEntity = items[entity] ?? []

  const total = filtered.length
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE))
  // Clamp during render instead of a useState+useEffect pair — an entity/gap
  // switch can strand `page` past the new, shorter list.
  const currentPage = Math.min(page, lastPage)
  const from = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const to = Math.min(currentPage * PAGE_SIZE, total)
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function handleEntityChange(next: GapQueueKey) {
    setEntity(next)
    setPage(1)
  }

  function handleGapChange(next: GapKind) {
    setGap(next)
    setPage(1)
  }

  return (
    <Card elevation={3} sx={{ backgroundColor: 'surface.containerLowest' }} variant="elevation">
      <CardContent>
        <Box sx={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          <Typography component="p" size="small" variant="label">
            Needs attention
          </Typography>
          <Box sx={{ ml: 'auto' }} />
          {/* All 13 entities listed — confirming an entity is clean is worth
              doing — plus the standalone-pieces bucket, whose rows appear in no
              other entity because they are excluded from container grouping. */}
          <TextField
            select
            label="Entity"
            size="small"
            sx={{ minWidth: 200 }}
            value={entity}
            onChange={(ev) => handleEntityChange(ev.target.value as GapQueueKey)}
          >
            {QUEUE_KEYS.map((key) => (
              <MenuItem key={key} value={key}>
                {queueBucket(key).title}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/*
          Hide a filter the entity cannot have. Duplicate detection returns
          with the deferred alt_slug work (see `isVariant` in
          lib/admin-entities.ts) — GapWorkItem carries no duplicate signal
          yet, so GapKind has no 'duplicate' member today.
        */}
        <GapFilterChips
          active={activeGap}
          items={GAPS.filter(({ kind }) => entityHasGapKind(e, kind)).map(({ kind, label }) => ({
            kind,
            label,
            count: containerGapCount(allForEntity, kind),
            dashed: isNonGating(entity, kind),
          }))}
          trailing={
            e.addHref && (
              <Button
                component="a"
                href={e.addHref}
                size="small"
                startIcon={<Add />}
                sx={{ ml: 'auto' }}
              >
                Add
              </Button>
            )
          }
          onChange={handleGapChange}
        />

        {rows.length === 0 ? (
          <GapEmptyState message={`Nothing needs attention in ${e.title}.`} />
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
                          primary: { variant: 'body', noWrap: true },
                          secondary: { variant: 'body', size: 'small' },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                  {i < rows.length - 1 && (
                    <Divider component="li" role="listitem" variant="inset" />
                  )}
                </Box>
              ))}
            </List>

            <GapPaginationFooter
              currentPage={currentPage}
              from={from}
              lastPage={lastPage}
              to={to}
              total={total}
              onNext={() => setPage(currentPage + 1)}
              onPrevious={() => setPage(currentPage - 1)}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}
