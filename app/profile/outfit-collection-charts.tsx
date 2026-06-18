'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  LinearProgress,
  Skeleton,
  Stack,
  Typography,
  useColorScheme,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { PieChart } from '@mui/x-charts/PieChart'
import { percent } from '@/hooks/count-obtained'
import { OutfitSet, Season } from '@/lib/types/outfit'
import PercentLabel from '@/components/percent-label'
import { SparkleIcon } from '@/components/rarity-stars'

const RINGS_CHART_SIZE = 240
const GLOWUP_CHART_SIZE = 220

// A variant group is complete when it is non-empty and every variant is obtained.
function isComplete(variants: { obtained?: boolean }[]) {
  return variants.length > 0 && variants.every((v) => v.obtained)
}

function OutfitRingsChart({
  setsObtained,
  setsTotal,
  evolutionsObtained,
  evolutionsTotal,
  seasonsObtained,
  seasonsTotal,
  variantsObtained,
  variantsTotal,
}: {
  setsObtained: number
  setsTotal: number
  evolutionsObtained: number
  evolutionsTotal: number
  seasonsObtained: number
  seasonsTotal: number
  variantsObtained: number
  variantsTotal: number
}) {
  const { mode, systemMode } = useColorScheme()
  const theme = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDarkMode = mounted && (mode === 'system' ? systemMode : mode) === 'dark'

  if (!mounted)
    return (
      <Card sx={{ gridColumn: { sm: '1 / -1', md: 'auto' } }} variant="outlined">
        <CardContent>
          <Skeleton height={RINGS_CHART_SIZE} variant="rounded" />
        </CardContent>
      </Card>
    )

  const muted = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'
  const tertiary = theme.palette.tertiary.main
  const ringColors = [1, 0.75, 0.55, 0.35].map((opacity) => alpha(tertiary, opacity))

  const rings = [
    {
      label: 'Sets',
      obtained: setsObtained,
      total: setsTotal,
      color: ringColors[0],
      innerRadius: 35,
      outerRadius: 52,
    },
    {
      label: 'Evolutions',
      obtained: evolutionsObtained,
      total: evolutionsTotal,
      color: ringColors[1],
      innerRadius: 56,
      outerRadius: 72,
    },
    {
      label: 'Seasons',
      obtained: seasonsObtained,
      total: seasonsTotal,
      color: ringColors[2],
      innerRadius: 76,
      outerRadius: 90,
    },
    {
      label: 'Variants',
      obtained: variantsObtained,
      total: variantsTotal,
      color: ringColors[3],
      innerRadius: 94,
      outerRadius: 108,
    },
  ]

  const overallPct = percent(variantsObtained, variantsTotal)

  return (
    <Card sx={{ gridColumn: { sm: '1 / -1', md: 'auto' } }} variant="outlined">
      <CardHeader
        disableTypography
        sx={{ mt: -1 }}
        title={
          <Typography color="text.secondary" variant="overline">
            Hierarchy Progress
          </Typography>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row', md: 'column', lg: 'row' }}
          spacing={2}
          sx={{ alignItems: 'center' }}
        >
          <Box
            sx={{
              position: 'relative',
              width: RINGS_CHART_SIZE,
              height: RINGS_CHART_SIZE,
              flexShrink: 0,
            }}
          >
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
          </Box>

          <Stack
            spacing={1.5}
            sx={{ flex: 1, width: { xs: '100%', sm: 'auto', md: '100%', lg: 'auto' } }}
          >
            {rings.map((ring) => (
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
                  <Chip
                    label={`${ring.obtained} / ${ring.total}`}
                    size="small"
                    variant="outlined"
                  />
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
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

function OutfitGlowupChart({ outfitSets }: { outfitSets: OutfitSet[] }) {
  const { mode, systemMode } = useColorScheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDarkMode = mounted && (mode === 'system' ? systemMode : mode) === 'dark'
  const theme = useTheme()

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)

  if (!mounted)
    return (
      <Card sx={{ gridColumn: { sm: '1 / -1', md: 'auto' } }} variant="outlined">
        <CardContent>
          <Skeleton height={GLOWUP_CHART_SIZE} variant="rounded" />
        </CardContent>
      </Card>
    )

  const muted = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'
  const primary = theme.palette.primary.main
  const secondary = theme.palette.secondary.main

  // Sets that actually have a glow-up evolution with variants.
  const glowupSets = outfitSets
    .map((set) => {
      const variants = set.outfit_variants.filter((v) => v.evolution === set.glowup_evolution)
      return { set, variants }
    })
    .filter(({ set, variants }) => set.glowup_evolution && variants.length > 0)

  const glowupVariantsTotal = glowupSets.reduce((acc, { variants }) => acc + variants.length, 0)
  const glowupSetsTotal = glowupSets.length
  const glowupSetsObtained = glowupSets.filter(({ variants }) => isComplete(variants)).length

  const setSegments = glowupSets.map(({ set, variants }) => {
    const obtained = variants.filter((v) => v.obtained).length
    const total = variants.length
    return {
      id: set.slug,
      value: total,
      label: set.title,
      color: total > 0 && obtained === total ? secondary : muted,
      formattedValue: `${percent(obtained, total)}% (${obtained}/${total})`,
      obtained,
      total,
    }
  })

  const selected = selectedSlug ? (setSegments.find((s) => s.id === selectedSlug) ?? null) : null

  const innerObtained = selected ? selected.obtained : glowupSetsObtained
  const innerTotal = selected ? selected.total : glowupSetsTotal
  const innerPct = percent(innerObtained, innerTotal)

  if (glowupVariantsTotal === 0) return null

  return (
    <Card sx={{ gridColumn: { sm: '1 / -1', md: 'auto' } }} variant="outlined">
      <CardHeader
        disableTypography
        sx={{ mt: -1 }}
        title={
          <Typography color="text.secondary" variant="overline">
            Glow-up Progress
            <SparkleIcon
              aria-label="glow-up"
              color="inherit"
              fontSize="inherit"
              sx={{ rotate: '15deg', ml: 0.5, mb: 0.25 }}
            />
          </Typography>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row', md: 'column', lg: 'row' }}
          spacing={2}
          sx={{ alignItems: 'center' }}
        >
          <Box
            sx={{
              position: 'relative',
              width: GLOWUP_CHART_SIZE,
              height: GLOWUP_CHART_SIZE,
              flexShrink: 0,
            }}
          >
            <PieChart
              height={GLOWUP_CHART_SIZE}
              margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
              series={[
                {
                  data: [
                    {
                      id: 'obtained',
                      value: innerObtained,
                      label: 'Obtained',
                      color: primary,
                    },
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
                  id: 'sets',
                  data: setSegments,
                  innerRadius: 76,
                  outerRadius: 100,
                  paddingAngle: 1.5,
                  cornerRadius: 3,
                  valueFormatter: (item) =>
                    (item as (typeof setSegments)[number]).formattedValue ??
                    `${percent(item.value, glowupVariantsTotal)}%`,
                },
              ]}
              slots={{ legend: () => null }}
              width={GLOWUP_CHART_SIZE}
              onItemClick={(_, { seriesId, dataIndex }) => {
                if (seriesId !== 'sets') return
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
          </Box>

          <Stack
            spacing={2}
            sx={{ flex: 1, width: { xs: '100%', sm: 'auto', md: '100%', lg: 'auto' } }}
          >
            {[
              {
                label: selected ? selected.label : 'Overall',
                rows: [
                  { color: primary, text: 'Obtained', value: `${innerObtained} / ${innerTotal}` },
                  {
                    color: muted,
                    text: 'Missing',
                    value: `${innerTotal - innerObtained} / ${innerTotal}`,
                  },
                ],
              },
              {
                label: 'Glow-ups',
                rows: [
                  {
                    color: secondary,
                    text: 'Complete',
                    value: `${glowupSetsObtained} / ${glowupSetsTotal}`,
                  },
                  {
                    color: muted,
                    text: 'Unfinished',
                    value: `${glowupSetsTotal - glowupSetsObtained} / ${glowupSetsTotal}`,
                  },
                ],
              },
            ].map(({ label, rows }) => (
              <Stack key={label} spacing={0.75}>
                <Typography color="text.secondary" variant="caption">
                  {label}
                </Typography>
                {rows.map(({ color, text, value }) => (
                  <Stack key={text} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '3px',
                        bgcolor: color,
                        flexShrink: 0,
                      }}
                    />
                    <Typography sx={{ flex: 1 }} variant="body2">
                      {text}
                    </Typography>
                    <Chip label={`${value}`} size="small" variant="outlined" />
                  </Stack>
                ))}
              </Stack>
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default function OutfitCollectionCharts({
  outfitSets,
  seasons,
}: {
  outfitSets: OutfitSet[]
  seasons: Season[]
}) {
  const allVariants = outfitSets.flatMap((set) => set.outfit_variants)
  const variantsObtained = allVariants.filter((v) => v.obtained).length
  const variantsTotal = allVariants.length

  // A set is complete when its base evolution variants are all obtained
  // (mirrors ProfileStats' outfit-set count).
  const setsObtained = outfitSets.filter((set) =>
    isComplete(set.outfit_variants.filter((v) => v.evolution === `${set.slug}-base`))
  ).length

  // Non-glow-up evolutions across all sets (base is already excluded from
  // set.evolutions by createOutfitSet).
  const evolutionGroups = outfitSets.flatMap((set) =>
    set.evolutions
      .filter((evolution) => evolution.slug !== set.glowup_evolution)
      .map((evolution) => set.outfit_variants.filter((v) => v.evolution === evolution.slug))
  )
  const evolutionsTotal = evolutionGroups.length
  const evolutionsObtained = evolutionGroups.filter(isComplete).length

  // A season is complete when every set in that season is fully obtained.
  const seasonsTotal = seasons.length
  const seasonsObtained = seasons.filter((season) => {
    const sets = outfitSets.filter((set) => set.seasons === season.slug)
    return sets.length > 0 && sets.every((set) => isComplete(set.outfit_variants))
  }).length

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { sm: '1fr', md: '1fr 1fr' },
        gap: 2,
      }}
    >
      <OutfitRingsChart
        evolutionsObtained={evolutionsObtained}
        evolutionsTotal={evolutionsTotal}
        seasonsObtained={seasonsObtained}
        seasonsTotal={seasonsTotal}
        setsObtained={setsObtained}
        setsTotal={outfitSets.length}
        variantsObtained={variantsObtained}
        variantsTotal={variantsTotal}
      />
      <OutfitGlowupChart outfitSets={outfitSets} />
    </Box>
  )
}
