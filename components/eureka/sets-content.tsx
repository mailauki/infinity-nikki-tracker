'use client'

import { Box, Button, Divider, Skeleton, Stack } from '@mui/material'
import { ChevronRight } from '@mui/icons-material'

import ErrorAlert from '@/components/error-alert'
import { useEurekaData } from '@/components/eureka/eureka-context'
import { useSortOrder } from '@/components/sort-context'
import { GRID_COLUMNS } from '@/lib/types/props'
import EurekaColorSetCard from '@/components/eureka/eureka-color-set-card'
import ProgressChip from '@/components/progress-chip'
import { countObtained, percent } from '@/hooks/count-obtained'

function SetSkeleton() {
  return (
    <Box>
      <Stack direction="row" sx={{ mb: 0.5, justifyContent: 'space-between' }}>
        <Skeleton height={28} variant="text" width={140} />
        <Skeleton height={24} variant="rounded" width={60} />
      </Stack>
      <Divider sx={{ mb: 2 }} />
      <Box
        sx={{ display: 'grid', gridTemplateColumns: GRID_COLUMNS, gap: { xs: 1, sm: 1.5, md: 2 } }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton
            key={i}
            height={0}
            style={{ paddingBottom: '133%' }}
            sx={{ borderRadius: 1 }}
            variant="rectangular"
            width="100%"
          />
        ))}
      </Box>
    </Box>
  )
}

export default function SetsContent() {
  const { eurekaSets, isLoggedIn, isLoading, isError } = useEurekaData()
  const { sortOrder } = useSortOrder()

  if (isError) {
    return <ErrorAlert message="Failed to load Eureka data. Please refresh the page." />
  }

  if (isLoading) {
    return (
      <Stack spacing={4}>
        {Array.from({ length: 3 }).map((_, i) => (
          <SetSkeleton key={i} />
        ))}
      </Stack>
    )
  }

  const sortedSets = [...eurekaSets].sort((a, b) => {
    const rarityDiff = (b.rarity ?? 0) - (a.rarity ?? 0)
    if (rarityDiff !== 0) return rarityDiff
    return sortOrder === 'new' ? b.id! - a.id! : a.id! - b.id!
  })

  return (
    <Stack spacing={4}>
      {sortedSets.map((set) => {
        const { obtained, total } = countObtained(set.eureka_variants)
        return (
          <Box key={set.slug}>
            <Stack
              direction="row"
              sx={{ mb: 0.5, alignItems: 'flex-end', justifyContent: 'space-between' }}
            >
              <Button
                color="inherit"
                endIcon={<ChevronRight />}
                href={`/eureka/${set.slug}`}
                size="small"
              >
                {set.title}
              </Button>
              {isLoggedIn && <ProgressChip percentage={percent(obtained, total)} size="lg" />}
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: GRID_COLUMNS,
                gap: { xs: 1, sm: 1.5, md: 2 },
              }}
            >
              {set.colors.map((color) => (
                <EurekaColorSetCard
                  key={color.slug}
                  color={color}
                  eurekaSet={set}
                  isLoggedIn={isLoggedIn}
                />
              ))}
            </Box>
          </Box>
        )
      })}
    </Stack>
  )
}
