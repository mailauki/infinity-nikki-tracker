'use client'

import { forwardRef, useState } from 'react'
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  Slide,
  Stack,
  Typography,
  useColorScheme,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { PieChart } from '@mui/x-charts/PieChart'
import { lime } from '@mui/material/colors'
import { TransitionProps } from '@mui/material/transitions'
import { Check, Close } from '@mui/icons-material'
import { countObtained, percent } from '@/hooks/count-obtained'
import { EurekaCategory, EurekaColor, EurekaSet, Trial } from '@/lib/types/eureka'
import EurekaCardProgress from '@/components/eureka/eureka-card-progress'
import LazyAvatar from '@/components/lazy-avatar'
import { toTitle } from '@/lib/utils'
import { AvatarSize } from '@/lib/types/props'

const SlideUp = forwardRef(function SlideUp(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide ref={ref} direction="up" {...props} />
})

type StatItem = { title: string; imageUrl?: string | null; obtained: number; total: number }

function StatItemRow({ item, size }: { item: StatItem; size: AvatarSize }) {
  const percentage = percent(item.obtained, item.total)

  return (
    <ListItem disableGutters alignItems="center" sx={{ gap: 1.5 }}>
      <LazyAvatar size={size} src={item.imageUrl ?? undefined} />
      <Stack spacing={0.5} sx={{ flex: 1 }}>
        <Typography variant="body2">{item.title}</Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <LinearProgress
            color="inherit"
            sx={{ flex: 1 }}
            value={percentage}
            variant="determinate"
          />
          <Typography color="text.secondary" variant="caption">
            {percentage}%
          </Typography>
        </Stack>
      </Stack>
      <Chip label={`${item.obtained} / ${item.total}`} size="small" variant="outlined" />
    </ListItem>
  )
}

const RINGS_CHART_SIZE = 240
const COLOR_SETS_CHART_SIZE = 220

function CollectionRingsChart({
  setsObtained,
  setsTotal,
  colorSetsObtained,
  colorSetsTotal,
  categoriesObtained,
  categoriesTotal,
  variantsObtained,
  variantsTotal,
}: {
  setsObtained: number
  setsTotal: number
  colorSetsObtained: number
  colorSetsTotal: number
  categoriesObtained: number
  categoriesTotal: number
  variantsObtained: number
  variantsTotal: number
}) {
  const { mode, systemMode } = useColorScheme()
  const isDarkMode = (mode === 'system' ? systemMode : mode) === 'dark'

  const muted = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'
  const ringColors = isDarkMode
    ? [lime[500], lime[400], lime[300], lime[200]]
    : [lime[900], lime[700], lime[500], lime[300]]

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
      label: 'Color Sets',
      obtained: colorSetsObtained,
      total: colorSetsTotal,
      color: ringColors[1],
      innerRadius: 56,
      outerRadius: 72,
    },
    {
      label: 'Categories',
      obtained: categoriesObtained,
      total: categoriesTotal,
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
    <Card sx={{ gridColumn: '1 / -1' }} variant="outlined">
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
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
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
                  { id: `${ring.label}-obtained`, value: ring.obtained, color: ring.color },
                  {
                    id: `${ring.label}-remaining`,
                    value: ring.total - ring.obtained,
                    color: muted,
                  },
                ],
                innerRadius: ring.innerRadius,
                outerRadius: ring.outerRadius,
                paddingAngle: ring.obtained > 0 && ring.obtained < ring.total ? 2 : 0,
                cornerRadius: 3,
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
              {overallPct === 100 ? (
                <Check color="primary" sx={{ fontSize: 28 }} />
              ) : (
                <Typography color="text.secondary" variant="caption">
                  {overallPct}%
                </Typography>
              )}
            </Box>
          </Box>

          <Stack spacing={1.5} sx={{ flex: 1, width: { xs: '100%', sm: 'auto' } }}>
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

function CollectionColorSetsChart({
  variantsObtained,
  variantsTotal,
  colorSetsObtained,
  colorSetsTotal,
  sets,
}: {
  variantsObtained: number
  variantsTotal: number
  colorSetsObtained: number
  colorSetsTotal: number
  sets: EurekaSet[]
}) {
  const { mode, systemMode } = useColorScheme()
  const isDarkMode = (mode === 'system' ? systemMode : mode) === 'dark'
  const theme = useTheme()

  const muted = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'
  const primary = theme.palette.primary.main
  const overallPct = percent(variantsObtained, variantsTotal)

  const colorSetSegments = sets
    .flatMap((set) =>
      set.colors.map((color) => {
        const variants = set.eureka_variants.filter((v) => v.color === color.slug)
        const { obtained, total } = countObtained(variants)
        return {
          id: `${set.slug}-${color.slug}`,
          value: total,
          label: `${set.title} — ${color.title}`,
          color: total > 0 && obtained === total ? primary : muted,
        }
      })
    )
    .filter((s) => s.value > 0)

  if (variantsTotal === 0) return null

  return (
    <Card sx={{ gridColumn: '1 / -1' }} variant="outlined">
      <CardHeader
        disableTypography
        sx={{ mt: -1 }}
        title={
          <Typography color="text.secondary" variant="overline">
            Color Set Progress
          </Typography>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
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
                    { id: 'obtained', value: variantsObtained, color: primary },
                    { id: 'remaining', value: variantsTotal - variantsObtained, color: muted },
                  ],
                  innerRadius: 40,
                  outerRadius: 62,
                  paddingAngle: variantsObtained > 0 && variantsObtained < variantsTotal ? 2 : 0,
                  cornerRadius: 4,
                },
                {
                  data: colorSetSegments,
                  innerRadius: 67,
                  outerRadius: 100,
                  paddingAngle: 1.5,
                  cornerRadius: 3,
                },
              ]}
              slots={{ legend: () => null }}
              width={COLOR_SETS_CHART_SIZE}
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
              {overallPct === 100 ? (
                <Check color="primary" sx={{ fontSize: 32 }} />
              ) : (
                <Typography sx={{ fontWeight: 'medium' }} variant="h6">
                  {overallPct}%
                </Typography>
              )}
            </Box>
          </Box>

          <Stack spacing={2} sx={{ flex: 1, width: { xs: '100%', sm: 'auto' } }}>
            <Stack spacing={0.75}>
              <Typography color="text.secondary" variant="caption">
                Variants
              </Typography>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '3px',
                    bgcolor: primary,
                    flexShrink: 0,
                  }}
                />
                <Typography sx={{ flex: 1 }} variant="body2">
                  Obtained
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {variantsObtained} / {variantsTotal}
                </Typography>
              </Stack>
            </Stack>

            <Stack spacing={0.75}>
              <Typography color="text.secondary" variant="caption">
                Color Sets
              </Typography>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '3px',
                    bgcolor: primary,
                    flexShrink: 0,
                  }}
                />
                <Typography sx={{ flex: 1 }} variant="body2">
                  Complete
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {colorSetsObtained} / {colorSetsTotal}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Box
                  sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: muted, flexShrink: 0 }}
                />
                <Typography sx={{ flex: 1 }} variant="body2">
                  Incomplete
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {colorSetsTotal - colorSetsObtained}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

function CollectionStatCard({
  title,
  obtained,
  total,
  items,
}: {
  title: string
  obtained: number
  total: number
  items: StatItem[]
}) {
  const [open, setOpen] = useState(false)
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const percentage = percent(obtained, total)

  return (
    <>
      <Card variant="outlined">
        <CardActionArea sx={{ pb: 1.5 }} onClick={() => setOpen(true)}>
          <CardHeader
            disableTypography
            action={
              <Chip
                label={`${obtained} / ${total}`}
                size="small"
                sx={{ mt: 1 }}
                variant="outlined"
              />
            }
            sx={{ mt: -1 }}
            title={
              <Typography color="text.secondary" variant="overline">
                {title}
              </Typography>
            }
          />
          <EurekaCardProgress percentage={percentage} size="xs" />
        </CardActionArea>
      </Card>

      <Dialog
        fullWidth
        fullScreen={fullScreen}
        maxWidth="sm"
        open={open}
        slots={{ transition: SlideUp }}
        onClose={() => setOpen(false)}
      >
        <DialogTitle>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">{title}</Typography>
            <IconButton aria-label="close" size="small" onClick={() => setOpen(false)}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 1, pb: 8, maxHeight: { sm: '60vh' } }}>
          <List disablePadding>
            {items.map((item, index) => (
              <StatItemRow key={index} item={item} size={title === 'Colors' ? 'xs' : 'md'} />
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function CollectionStats({
  sets,
  colors,
  categories,
  trials,
}: {
  sets: EurekaSet[]
  colors: EurekaColor[]
  categories: EurekaCategory[]
  trials: Trial[]
}) {
  const allVariants = sets.flatMap((set) => set.eureka_variants)

  const setsObtained = sets.filter((set) =>
    set.eureka_variants.every((variant) => variant.obtained)
  ).length
  const setItems: StatItem[] = sets.map((set) => {
    const { obtained, total } = countObtained(set.eureka_variants)
    return { title: set.title, imageUrl: set.image_url, obtained, total }
  })

  const { obtained: variantsObtained, total: variantsTotal } = countObtained(allVariants)
  const variantItems: StatItem[] = allVariants.map((v) => ({
    title: `${toTitle(v.category ?? '')} — ${toTitle(v.color ?? '')}`,
    imageUrl: v.image_url,
    obtained: v.obtained ? 1 : 0,
    total: 1,
  }))

  const colorSetsObtained = sets.reduce(
    (count, set) =>
      count +
      set.colors.filter((color) =>
        set.eureka_variants
          .filter((variant) => variant.color === color.slug)
          .every((variant) => variant.obtained)
      ).length,
    0
  )
  const colorSetsTotal = sets.reduce((sum, set) => sum + set.colors.length, 0)
  const colorSetItems: StatItem[] = sets.flatMap((set) =>
    set.colors.map((color) => {
      const variants = set.eureka_variants.filter((v) => v.color === color.slug)
      const { obtained, total } = countObtained(variants)
      return {
        title: `${set.title} — ${color.title}`,
        imageUrl: variants[0]?.image_url,
        obtained,
        total,
      }
    })
  )

  const categoriesObtained = categories.filter((category) =>
    allVariants
      .filter((variant) => variant.category === category.slug)
      .every((variant) => variant.obtained)
  ).length
  const categoryItems: StatItem[] = categories.map((category) => {
    const variants = allVariants.filter((variant) => variant.category === category.slug)
    const { obtained, total } = countObtained(variants)
    return { title: category.title, imageUrl: category.image_url, obtained, total }
  })

  const colorsObtained = colors.filter((color) =>
    allVariants
      .filter((variant) => variant.color === color.slug)
      .every((variant) => variant.obtained)
  ).length
  const colorItems: StatItem[] = colors.map((color) => {
    const variants = allVariants.filter((variant) => variant.color === color.slug)
    const { obtained, total } = countObtained(variants)
    return { title: color.title ?? '', imageUrl: color.image_url, obtained, total }
  })

  const trialsObtained = trials.filter((trial) =>
    sets
      .filter((set) => set.eureka_set_trials.some((setTrial) => setTrial.trial === trial.slug))
      .every((set) => set.eureka_variants.every((variant) => variant.obtained))
  ).length
  const trialItems: StatItem[] = trials.map((trial) => {
    const trialSets = sets.filter((s) => s.eureka_set_trials.some((t) => t.trial === trial.slug))
    const variants = trialSets.flatMap((s) => s.eureka_variants)
    const { obtained, total } = countObtained(variants)
    return { title: trial.title ?? '', imageUrl: trial.image_url, obtained, total }
  })

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr' },
        gap: 2,
      }}
    >
      <CollectionRingsChart
        categoriesObtained={categoriesObtained}
        categoriesTotal={categories.length}
        colorSetsObtained={colorSetsObtained}
        colorSetsTotal={colorSetsTotal}
        setsObtained={setsObtained}
        setsTotal={sets.length}
        variantsObtained={variantsObtained}
        variantsTotal={variantsTotal}
      />
      <CollectionColorSetsChart
        colorSetsObtained={colorSetsObtained}
        colorSetsTotal={colorSetsTotal}
        sets={sets}
        variantsObtained={variantsObtained}
        variantsTotal={variantsTotal}
      />
      <CollectionStatCard
        items={setItems}
        obtained={setsObtained}
        title="Sets"
        total={sets.length}
      />
      <CollectionStatCard
        items={variantItems}
        obtained={variantsObtained}
        title="Variants"
        total={variantsTotal}
      />
      <CollectionStatCard
        items={colorSetItems}
        obtained={colorSetsObtained}
        title="Color Sets"
        total={colorSetsTotal}
      />
      <CollectionStatCard
        items={categoryItems}
        obtained={categoriesObtained}
        title="Categories"
        total={categories.length}
      />
      <CollectionStatCard
        items={colorItems}
        obtained={colorsObtained}
        title="Colors"
        total={colors.length}
      />
      <CollectionStatCard
        items={trialItems}
        obtained={trialsObtained}
        title="Trials"
        total={trials.length}
      />
    </Box>
  )
}
