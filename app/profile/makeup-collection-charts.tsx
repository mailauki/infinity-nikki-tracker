'use client'

import { useEffect, useState } from 'react'
import { Box, LinearProgress, Stack, Typography, useColorScheme, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { PieChart } from '@mui/x-charts/PieChart'
import { percent } from '@/hooks/count-obtained'
import { isStandaloneMakeupSet } from '@/hooks/makeup'
import { MakeupSet } from '@/lib/types/makeup'
import { Season } from '@/lib/types/outfit'
import PercentLabel from '@/components/percent-label'
import ProgressChip from '@/components/progress-chip'
import { SimpleGrid } from '@/components/card-grid'
import { ChartCard } from './collection-layout'

const RINGS_CHART_SIZE = 240
const SEASONS_CHART_SIZE = 220

// A variant group is complete when it is non-empty and every variant is obtained.
function isComplete(variants: { obtained?: boolean }[]) {
  return variants.length > 0 && variants.every((v) => v.obtained)
}

// The variants a set owns itself. createMakeupSet concatenates each evolution's
// variants onto its base set, so an unscoped check would let one unfinished
// evolution suppress a completed base set. The synthetic "Standalone Pieces"
// bucket also collects straggler variants whose makeup_set is still NULL —
// match those to it the way createMakeupSet does. Mirrors ProfileStats.
function ownVariants(set: MakeupSet) {
  return set.makeup_variants.filter((v) =>
    isStandaloneMakeupSet(set)
      ? !v.makeup_set || v.makeup_set === set.slug
      : v.makeup_set === set.slug
  )
}

function MakeupRingsChart({
  setsObtained,
  setsTotal,
  evolutionsObtained,
  evolutionsTotal,
  variantsObtained,
  variantsTotal,
}: {
  setsObtained: number
  setsTotal: number
  evolutionsObtained: number
  evolutionsTotal: number
  variantsObtained: number
  variantsTotal: number
}) {
  const { mode, systemMode } = useColorScheme()
  const theme = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDarkMode = mounted && (mode === 'system' ? systemMode : mode) === 'dark'

  const muted = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'
  const tertiary = theme.palette.tertiary.main
  // Three rings rather than the outfit chart's four (makeup has no glow-ups),
  // so take its first, second, and fourth opacity steps — skipping one keeps
  // the outermost ring clearly distinct from its neighbour.
  const ringColors = [1, 0.75, 0.35].map((opacity) => alpha(tertiary, opacity))

  const rings = [
    {
      label: 'Sets',
      obtained: setsObtained,
      total: setsTotal,
      color: ringColors[0],
      innerRadius: 42,
      outerRadius: 62,
    },
    {
      label: 'Evolutions',
      obtained: evolutionsObtained,
      total: evolutionsTotal,
      color: ringColors[1],
      innerRadius: 68,
      outerRadius: 86,
    },
    {
      label: 'Variants',
      obtained: variantsObtained,
      total: variantsTotal,
      color: ringColors[2],
      innerRadius: 92,
      outerRadius: 108,
    },
  ]

  const overallPct = percent(variantsObtained, variantsTotal)

  return (
    <ChartCard
      chart={
        <>
          <PieChart
            height={RINGS_CHART_SIZE}
            margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
            series={rings.map((ring) => ({
              data: [
                {
                  id: `${ring.label}-obtained`,
                  value: ring.obtained,
                  label: ring.label,
                  color: ring.color,
                },
                {
                  id: `${ring.label}-remaining`,
                  value: ring.total - ring.obtained,
                  label: `${ring.label} remaining`,
                  color: muted,
                },
              ],
              innerRadius: ring.innerRadius,
              outerRadius: ring.outerRadius,
              paddingAngle: ring.obtained > 0 && ring.obtained < ring.total ? 2 : 0,
              cornerRadius: 3,
              valueFormatter: (item) => `${percent(item.value, ring.total)}%`,
            }))}
            slots={{ legend: () => null }}
            width={RINGS_CHART_SIZE}
          />
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <PercentLabel percentage={overallPct} />
          </Box>
        </>
      }
      legend={rings.map((ring) => (
        <Stack key={ring.label} spacing={0.5}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '3px',
                bgcolor: ring.color,
                flexShrink: 0,
              }}
            />
            <Typography sx={{ flex: 1 }} variant="body2">
              {ring.label}
            </Typography>
            <ProgressChip obtained={ring.obtained} total={ring.total} variant="parts" />
          </Stack>
          <Box sx={{ ml: 3, color: ring.color }}>
            <LinearProgress
              color="inherit"
              value={percent(ring.obtained, ring.total)}
              variant="determinate"
            />
          </Box>
        </Stack>
      ))}
      mounted={mounted}
      size={RINGS_CHART_SIZE}
      title="Hierarchy Progress"
    />
  )
}

function MakeupSeasonsChart({
  makeupSets,
  seasons,
}: {
  makeupSets: MakeupSet[]
  seasons: Season[]
}) {
  const { mode, systemMode } = useColorScheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDarkMode = mounted && (mode === 'system' ? systemMode : mode) === 'dark'
  const theme = useTheme()

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)

  const muted = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'
  const primary = theme.palette.primary.main
  const secondary = theme.palette.secondary.main

  // Seasons that actually have sets with variants. Progress is measured on each
  // set's own variants, matching the Sets ring — evolution variants belong to
  // the evolution, not the base set's season tally. (The outfit equivalent
  // scopes to `default` variants instead; makeup has no such flag.)
  const seasonGroups = seasons
    .map((season) => {
      const variants = makeupSets.filter((set) => set.seasons === season.slug).flatMap(ownVariants)
      return { season, variants }
    })
    .filter(({ variants }) => variants.length > 0)

  const seasonVariantsTotal = seasonGroups.reduce((acc, { variants }) => acc + variants.length, 0)
  const seasonsTotal = seasonGroups.length
  const seasonsObtained = seasonGroups.filter(({ variants }) => isComplete(variants)).length

  const setSegments = seasonGroups.map(({ season, variants }) => {
    const obtained = variants.filter((v) => v.obtained).length
    const total = variants.length
    // Heat-map: quantize completion into 5 opacity bands so a season's fill
    // intensity reads as its progress at a glance. Mirrors the outfit chart.
    const ratio = total > 0 ? obtained / total : 0
    return {
      id: season.slug,
      value: total,
      label: season.title,
      color: ratio === 0 ? muted : alpha(secondary, Math.ceil(ratio * 5) / 5),
      formattedValue: `${percent(obtained, total)}% (${obtained}/${total})`,
      obtained,
      total,
    }
  })

  const selected = selectedSlug ? (setSegments.find((s) => s.id === selectedSlug) ?? null) : null

  const innerObtained = selected ? selected.obtained : seasonsObtained
  const innerTotal = selected ? selected.total : seasonsTotal
  const innerPct = percent(innerObtained, innerTotal)

  if (mounted && seasonVariantsTotal === 0) return null

  return (
    <ChartCard
      chart={
        <>
          <PieChart
            height={SEASONS_CHART_SIZE}
            margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
            series={[
              {
                data: [
                  { id: 'obtained', value: innerObtained, label: 'Obtained', color: primary },
                  {
                    id: 'remaining',
                    value: innerTotal - innerObtained,
                    label: 'Remaining',
                    color: muted,
                  },
                ],
                innerRadius: 40,
                outerRadius: 62,
                paddingAngle: innerObtained > 0 && innerObtained < innerTotal ? 2 : 0,
                cornerRadius: 4,
                valueFormatter: (item) => `${percent(item.value, innerTotal)}%`,
              },
              {
                id: 'seasons',
                data: setSegments,
                innerRadius: 76,
                outerRadius: 100,
                paddingAngle: 1.5,
                cornerRadius: 3,
                valueFormatter: (item) =>
                  (item as (typeof setSegments)[number]).formattedValue ??
                  `${percent(item.value, seasonVariantsTotal)}%`,
              },
            ]}
            slots={{ legend: () => null }}
            width={SEASONS_CHART_SIZE}
            onItemClick={(_, { seriesId, dataIndex }) => {
              if (seriesId !== 'seasons') return
              const slug = setSegments[dataIndex]?.id ?? null
              setSelectedSlug((prev) => (prev === slug ? null : slug))
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <PercentLabel percentage={innerPct} />
          </Box>
        </>
      }
      legend={[
        {
          label: selected ? selected.label : 'Overall',
          rows: [
            { color: primary, text: 'Obtained', obtained: innerObtained, total: innerTotal },
            {
              color: muted,
              text: 'Missing',
              obtained: innerTotal - innerObtained,
              total: innerTotal,
            },
          ],
        },
        {
          label: 'Seasons',
          rows: [
            {
              color: secondary,
              text: 'Complete',
              obtained: seasonsObtained,
              total: seasonsTotal,
            },
            {
              color: muted,
              text: 'Unfinished',
              obtained: seasonsTotal - seasonsObtained,
              total: seasonsTotal,
            },
          ],
        },
      ].map(({ label, rows }) => (
        <Stack key={label} spacing={0.75}>
          <Typography color="text.secondary" variant="caption">
            {label}
          </Typography>
          {rows.map((row) => (
            <Stack key={row.text} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '3px',
                  bgcolor: row.color,
                  flexShrink: 0,
                }}
              />
              <Typography sx={{ flex: 1 }} variant="body2">
                {row.text}
              </Typography>
              <ProgressChip obtained={row.obtained} total={row.total} variant="parts" />
            </Stack>
          ))}
        </Stack>
      ))}
      mounted={mounted}
      size={SEASONS_CHART_SIZE}
      title="Season Progress"
    />
  )
}

export default function MakeupCollectionCharts({
  makeupSets,
  seasons,
}: {
  makeupSets: MakeupSet[]
  seasons: Season[]
}) {
  // `makeupSets` holds base sets only (createMakeupSet nests evolutions rather
  // than listing them at the top level), and each base already carries its
  // evolutions' variants concatenated onto `makeup_variants`. So this flat map
  // is the real total — every variant, evolution ones included, counted once.
  const allVariants = makeupSets.flatMap((set) => set.makeup_variants)
  const variantsObtained = allVariants.filter((v) => v.obtained).length
  const variantsTotal = allVariants.length

  // Set completion, by contrast, is judged on the set's OWN variants — an
  // unfinished evolution shouldn't keep a completed base set from counting.
  const setsObtained = makeupSets.filter((set) => isComplete(ownVariants(set))).length

  // Evolutions are nested under their base set, and each carries only its own
  // variants (createMakeupSet builds them with no evolutions of their own), so
  // ownVariants would be a no-op here — read makeup_variants directly. Makeup
  // has no glow-up concept, so unlike outfits there is nothing to exclude.
  const evolutionGroups = makeupSets.flatMap((set) =>
    set.evolutions.map((evolution) => evolution.makeup_variants)
  )
  const evolutionsTotal = evolutionGroups.length
  const evolutionsObtained = evolutionGroups.filter(isComplete).length

  return (
    <SimpleGrid columns={{ sm: '1fr', md: '1fr 1fr' }}>
      <MakeupRingsChart
        evolutionsObtained={evolutionsObtained}
        evolutionsTotal={evolutionsTotal}
        setsObtained={setsObtained}
        setsTotal={makeupSets.length}
        variantsObtained={variantsObtained}
        variantsTotal={variantsTotal}
      />
      <MakeupSeasonsChart makeupSets={makeupSets} seasons={seasons} />
    </SimpleGrid>
  )
}
