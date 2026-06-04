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

const CHART_SIZE = 180

function CollectionDonutChart({ obtained, total }: { obtained: number; total: number }) {
  const remaining = total - obtained
  const { mode, systemMode } = useColorScheme()
  const isDarkMode = (mode === 'system' ? systemMode : mode) === 'dark'
  const theme = useTheme()
  const percentage = percent(obtained, total)

  if (total === 0) return null

  return (
    <Card sx={{ gridColumn: '1 / -1' }} variant="outlined">
      <CardHeader
        disableTypography
        action={
          <Chip label={`${obtained} / ${total}`} size="small" sx={{ mt: 1 }} variant="outlined" />
        }
        sx={{ mt: -1 }}
        title={
          <Typography color="text.secondary" variant="overline">
            Overall Progress
          </Typography>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
          <Box sx={{ position: 'relative', width: CHART_SIZE, height: CHART_SIZE, flexShrink: 0 }}>
            <PieChart
              height={CHART_SIZE}
              margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
              series={[
                {
                  data: [
                    {
                      id: 'obtained',
                      value: obtained,
                      label: 'Obtained',
                      color: theme.palette.primary.main,
                    },
                    {
                      id: 'remaining',
                      value: remaining,
                      label: 'Remaining',
                      color: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                    },
                  ],
                  innerRadius: 55,
                  outerRadius: 84,
                  paddingAngle: obtained > 0 && remaining > 0 ? 2 : 0,
                  cornerRadius: 4,
                },
              ]}
              slots={{ legend: () => null }}
              width={CHART_SIZE}
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
              {percentage === 100 ? (
                <Check color="primary" sx={{ fontSize: 36 }} />
              ) : (
                <Typography sx={{ fontWeight: 'medium' }} variant="h5">
                  {percentage}%
                </Typography>
              )}
            </Box>
          </Box>

          <Stack spacing={1.5} sx={{ flex: 1, width: { xs: '100%', sm: 'auto' } }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '3px',
                  bgcolor: 'primary.main',
                  flexShrink: 0,
                }}
              />
              <Typography sx={{ flex: 1 }} variant="body2">
                Obtained
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {obtained}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '3px',
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                  flexShrink: 0,
                }}
              />
              <Typography sx={{ flex: 1 }} variant="body2">
                Remaining
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {remaining}
              </Typography>
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
      <CollectionDonutChart obtained={variantsObtained} total={variantsTotal} />
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
