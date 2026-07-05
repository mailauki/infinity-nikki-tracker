'use client'

import { Button, Skeleton, Stack } from '@mui/material'
import { ChevronRight } from '@mui/icons-material'

import ErrorAlert from '@/components/error-alert'
import { useEurekaData } from '@/components/eureka/eureka-context'
import { useSortOrder } from '@/components/sort-context'
import CardGrid, { CardGridHeader } from '@/components/card-grid'
import EurekaColorSetCard from '@/app/eureka/eureka-color-set-card'
import ProgressChip from '@/components/progress-chip'
import { countObtained } from '@/hooks/count-obtained'

function SetSkeleton() {
  return (
    <CardGrid
      header={
        <CardGridHeader
          actions={<Skeleton height={24} variant="rounded" width={60} />}
          title={<Skeleton height={28} variant="text" width={140} />}
        />
      }
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
    </CardGrid>
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
          <CardGrid
            key={set.slug}
            header={
              <CardGridHeader
                actions={isLoggedIn && <ProgressChip obtained={obtained} size="lg" total={total} />}
                title={
                  <Button
                    color="inherit"
                    endIcon={<ChevronRight />}
                    href={`/eureka/${set.slug}`}
                    size="small"
                  >
                    {set.title}
                  </Button>
                }
              />
            }
          >
            {set.colors.map((color) => (
              <EurekaColorSetCard
                key={color.slug}
                color={color}
                eurekaSet={set}
                isLoggedIn={isLoggedIn}
              />
            ))}
          </CardGrid>
        )
      })}
    </Stack>
  )
}
