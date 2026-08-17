'use client'

import { useEffect, useState } from 'react'
import { Box, LinearProgress, Stack, Typography, useColorScheme, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { PieChart } from '@mui/x-charts/PieChart'
import { percent } from '@/hooks/count-obtained'
import { MomoCloak } from '@/lib/types/momo'
import PercentLabel from '@/components/percent-label'
import ProgressChip from '@/components/progress-chip'
import { SparkleIcon } from '@/components/rarity-stars'
import { SimpleGrid } from '@/components/card-grid'
import { ChartCard } from './collection-layout'

const OVERALL_CHART_SIZE = 240
const RARITY_CHART_SIZE = 220

// Momo's Cloaks are a flat domain — one row per cloak, no variants, categories,
// or evolutions — so there is no set to complete and no hierarchy to ring.
// Progress is simply how many cloaks are obtained.
function CloakOverallChart({ obtained, total }: { obtained: number; total: number }) {
  const { mode, systemMode } = useColorScheme()
  const theme = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDarkMode = mounted && (mode === 'system' ? systemMode : mode) === 'dark'

  const muted = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'
  const tertiary = theme.palette.tertiary.main

  return (
    <ChartCard
      chart={
        <>
          <PieChart
            height={OVERALL_CHART_SIZE}
            margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
            series={[
              {
                data: [
                  { id: 'obtained', value: obtained, label: 'Obtained', color: tertiary },
                  {
                    id: 'remaining',
                    value: total - obtained,
                    label: 'Remaining',
                    color: muted,
                  },
                ],
                innerRadius: 70,
                outerRadius: 108,
                paddingAngle: obtained > 0 && obtained < total ? 2 : 0,
                cornerRadius: 4,
                valueFormatter: (item) => `${percent(item.value, total)}%`,
              },
            ]}
            slots={{ legend: () => null }}
            width={OVERALL_CHART_SIZE}
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
            <PercentLabel percentage={percent(obtained, total)} />
          </Box>
        </>
      }
      legend={[
        { color: tertiary, text: 'Obtained', obtained, total },
        { color: muted, text: 'Missing', obtained: total - obtained, total },
      ].map((row) => (
        <Stack key={row.text} spacing={0.5}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '3px',
                bgcolor: row.color,
                flexShrink: 0,
              }}
            />
            <Typography sx={{ flex: 1 }} variant="body">
              {row.text}
            </Typography>
            <ProgressChip obtained={row.obtained} total={row.total} variant="parts" />
          </Stack>
          <Box sx={{ ml: 3, color: row.color }}>
            <LinearProgress
              color="inherit"
              value={percent(row.obtained, row.total)}
              variant="determinate"
            />
          </Box>
        </Stack>
      ))}
      mounted={mounted}
      size={OVERALL_CHART_SIZE}
      title="Cloak Progress"
    />
  )
}

function CloakRarityChart({ cloaks }: { cloaks: MomoCloak[] }) {
  const { mode, systemMode } = useColorScheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDarkMode = mounted && (mode === 'system' ? systemMode : mode) === 'dark'
  const theme = useTheme()

  const [selectedRarity, setSelectedRarity] = useState<number | null>(null)

  const muted = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'
  const primary = theme.palette.primary.main
  const secondary = theme.palette.secondary.main

  // Group by rarity, ascending, skipping rarities no cloak actually uses.
  const rarityGroups = [...new Set(cloaks.map((c) => c.rarity ?? 0))]
    .sort((a, b) => a - b)
    .map((rarity) => ({ rarity, items: cloaks.filter((c) => (c.rarity ?? 0) === rarity) }))
    .filter(({ items }) => items.length > 0)

  const raritySegments = rarityGroups.map(({ rarity, items }) => {
    const obtained = items.filter((c) => c.obtained).length
    const total = items.length
    // Heat-map: quantize completion into 5 opacity bands so a rarity's fill
    // intensity reads as its progress at a glance. Mirrors the season chart.
    const ratio = total > 0 ? obtained / total : 0
    return {
      id: rarity,
      value: total,
      // Plain string: this feeds the PieChart tooltip, which renders it as
      // text — a JSX icon here would not survive. The legend heading below
      // uses the real SparkleIcon.
      label: `${rarity} star`,
      color: ratio === 0 ? muted : alpha(secondary, Math.ceil(ratio * 5) / 5),
      formattedValue: `${percent(obtained, total)}% (${obtained}/${total})`,
      obtained,
      total,
    }
  })

  const selected =
    selectedRarity !== null ? (raritySegments.find((s) => s.id === selectedRarity) ?? null) : null

  const raritiesTotal = rarityGroups.length
  const raritiesComplete = raritySegments.filter(
    (s) => s.total > 0 && s.obtained === s.total
  ).length

  const innerObtained = selected ? selected.obtained : raritiesComplete
  const innerTotal = selected ? selected.total : raritiesTotal
  const innerPct = percent(innerObtained, innerTotal)

  if (mounted && cloaks.length === 0) return null

  return (
    <ChartCard
      chart={
        <>
          <PieChart
            height={RARITY_CHART_SIZE}
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
                id: 'rarities',
                data: raritySegments,
                innerRadius: 76,
                outerRadius: 100,
                paddingAngle: 1.5,
                cornerRadius: 3,
                valueFormatter: (item) =>
                  (item as (typeof raritySegments)[number]).formattedValue ??
                  `${percent(item.value, cloaks.length)}%`,
              },
            ]}
            slots={{ legend: () => null }}
            width={RARITY_CHART_SIZE}
            onItemClick={(_, { seriesId, dataIndex }) => {
              if (seriesId !== 'rarities') return
              const rarity = raritySegments[dataIndex]?.id ?? null
              setSelectedRarity((prev) => (prev === rarity ? null : rarity))
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
          key: selected ? `rarity-${selected.id}` : 'overall',
          // The selected heading renders the rarity as a sparkle count, matching
          // the eureka 5-sparkle chart title rather than a literal ★ glyph.
          label: selected ? (
            <>
              {selected.id}{' '}
              <SparkleIcon
                aria-label="star"
                color="inherit"
                fontSize="inherit"
                sx={{ rotate: '15deg', ml: 0, mr: 0.5, mt: -0.25 }}
              />{' '}
              Cloaks
            </>
          ) : (
            'Overall'
          ),
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
          key: 'rarities',
          label: 'Rarities',
          rows: [
            {
              color: secondary,
              text: 'Complete',
              obtained: raritiesComplete,
              total: raritiesTotal,
            },
            {
              color: muted,
              text: 'Unfinished',
              obtained: raritiesTotal - raritiesComplete,
              total: raritiesTotal,
            },
          ],
        },
      ].map(({ key, label, rows }) => (
        <Stack key={key} spacing={0.75}>
          <Typography color="text.secondary" size="small" variant="body">
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
              <Typography sx={{ flex: 1 }} variant="body">
                {row.text}
              </Typography>
              <ProgressChip obtained={row.obtained} total={row.total} variant="parts" />
            </Stack>
          ))}
        </Stack>
      ))}
      mounted={mounted}
      size={RARITY_CHART_SIZE}
      title="Rarity Progress"
    />
  )
}

export default function MomoCloakCollectionCharts({ cloaks }: { cloaks: MomoCloak[] }) {
  const obtained = cloaks.filter((c) => c.obtained).length

  return (
    <SimpleGrid columns={{ sm: '1fr', md: '1fr 1fr' }}>
      <CloakOverallChart obtained={obtained} total={cloaks.length} />
      <CloakRarityChart cloaks={cloaks} />
    </SimpleGrid>
  )
}
