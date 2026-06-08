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
import { PieChart } from '@mui/x-charts/PieChart'
import { lime } from '@mui/material/colors'
import { countObtained, percent } from '@/hooks/count-obtained'
import { EurekaSet, Trial } from '@/lib/types/eureka'
import PercentLabel from '@/components/percent-label'
import { SparkleIcon } from '@/components/rarity-stars'

const RINGS_CHART_SIZE = 240
const COLOR_SETS_CHART_SIZE = 220

function CollectionRingsChart({
  eurekaSetsObtained,
  eurekaSetsTotal,
  colorSetsObtained,
  colorSetsTotal,
  trialsObtained,
  trialsTotal,
  variantsObtained,
  variantsTotal,
}: {
  eurekaSetsObtained: number
  eurekaSetsTotal: number
  colorSetsObtained: number
  colorSetsTotal: number
  trialsObtained: number
  trialsTotal: number
  variantsObtained: number
  variantsTotal: number
}) {
  const { mode, systemMode } = useColorScheme()
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
  const ringColors = isDarkMode
    ? [lime[500], lime[400], lime[300], lime[200]]
    : [lime[900], lime[700], lime[500], lime[300]]

  const rings = [
    {
      label: 'Sets',
      obtained: eurekaSetsObtained,
      total: eurekaSetsTotal,
      color: ringColors[0],
      innerRadius: 35,
      outerRadius: 52,
    },
    {
      label: 'Color Sets',
      obtained: colorSetsObtained,
      total: colorSetsTotal,
      color: ringColors[1],
      innerRadius: 56,
      outerRadius: 72,
    },
    {
      label: 'Trials',
      obtained: trialsObtained,
      total: trialsTotal,
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

function CollectionSetsChart({ eurekaSets }: { eurekaSets: EurekaSet[] }) {
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
          <Skeleton height={COLOR_SETS_CHART_SIZE} variant="rounded" />
        </CardContent>
      </Card>
    )

  const muted = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'
  const primary = theme.palette.primary.main
  const secondary = theme.palette.secondary.main

  const fiveStar = eurekaSets.filter((s) => s.rarity === 5)

  const fiveStarTotal = fiveStar.reduce(
    (acc, set) => acc + countObtained(set.eureka_variants).total,
    0
  )
  const fiveStarSetsTotal = fiveStar.length
  const fiveStarSetsObtained = fiveStar.filter(
    (set) => set.eureka_variants.length > 0 && set.eureka_variants.every((v) => v.obtained)
  ).length

  const setSegments = fiveStar
    .map((set) => {
      const { obtained, total } = countObtained(set.eureka_variants)
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
    .filter((s) => s.value > 0)

  const selected = selectedSlug ? (setSegments.find((s) => s.id === selectedSlug) ?? null) : null

  const innerObtained = selected ? selected.obtained : fiveStarSetsObtained
  const innerTotal = selected ? selected.total : fiveStarSetsTotal
  const innerPct = percent(innerObtained, innerTotal)

  if (fiveStarTotal === 0) return null

  return (
    <Card sx={{ gridColumn: { sm: '1 / -1', md: 'auto' } }} variant="outlined">
      <CardHeader
        disableTypography
        sx={{ mt: -1 }}
        title={
          <Typography color="text.secondary" variant="overline">
            5{' '}
            <SparkleIcon
              aria-label="star"
              color="inherit"
              fontSize="inherit"
              sx={{ rotate: '15deg', ml: 0, mr: 0.5, mb: 0.25 }}
            />{' '}
            Set Progress
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
              width: COLOR_SETS_CHART_SIZE,
              height: COLOR_SETS_CHART_SIZE,
              flexShrink: 0,
            }}
          >
            <PieChart
              height={COLOR_SETS_CHART_SIZE}
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
                    `${percent(item.value, fiveStarTotal)}%`,
                },
              ]}
              slots={{ legend: () => null }}
              width={COLOR_SETS_CHART_SIZE}
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
                label: 'Sets',
                rows: [
                  {
                    color: secondary,
                    text: 'Complete',
                    value: `${fiveStarSetsObtained} / ${fiveStarSetsTotal}`,
                  },
                  {
                    color: muted,
                    text: 'Unfinished',
                    value: `${fiveStarSetsTotal - fiveStarSetsObtained} / ${fiveStarSetsTotal}`,
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

export default function CollectionCharts({ eurekaSets, trials }: { eurekaSets: EurekaSet[]; trials: Trial[] }) {
  const allVariants = eurekaSets.flatMap((set) => set.eureka_variants)

  const eurekaSetsObtained = eurekaSets.filter((set) =>
    set.eureka_variants.every((variant) => variant.obtained)
  ).length

  const { obtained: variantsObtained, total: variantsTotal } = countObtained(allVariants)

  const colorSetsObtained = eurekaSets.reduce(
    (count, set) =>
      count +
      set.colors.filter((color) =>
        set.eureka_variants
          .filter((variant) => variant.color === color.slug)
          .every((variant) => variant.obtained)
      ).length,
    0
  )
  const colorSetsTotal = eurekaSets.reduce((sum, set) => sum + set.colors.length, 0)

  const trialsObtained = trials.filter((trial) =>
    eurekaSets
      .filter((set) => set.eureka_set_trials.some((setTrial) => setTrial.trial === trial.slug))
      .every((set) => set.eureka_variants.every((variant) => variant.obtained))
  ).length

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { sm: '1fr', md: '1fr 1fr' },
        gap: 2,
      }}
    >
      <CollectionRingsChart
        colorSetsObtained={colorSetsObtained}
        colorSetsTotal={colorSetsTotal}
        eurekaSetsObtained={eurekaSetsObtained}
        eurekaSetsTotal={eurekaSets.length}
        trialsObtained={trialsObtained}
        trialsTotal={trials.length}
        variantsObtained={variantsObtained}
        variantsTotal={variantsTotal}
      />
      <CollectionSetsChart eurekaSets={eurekaSets} />
    </Box>
  )
}
