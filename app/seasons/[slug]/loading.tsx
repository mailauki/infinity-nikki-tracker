import { Box, Divider, Skeleton, Stack } from '@mui/material'
import CardGrid, { SimpleGrid } from '@/components/card-grid'

function StatSkeleton() {
  return (
    <Stack spacing={0.5}>
      <Skeleton height={40} variant="text" width={72} />
      <Skeleton height={16} variant="text" width={90} />
    </Stack>
  )
}

// Matches the card shape used by the season sections: poster image plus a title
// and rarity line beneath.
function CardSkeleton() {
  return (
    <Box>
      <Skeleton
        sx={{ width: '100%', aspectRatio: '2 / 3', borderRadius: 1 }}
        variant="rectangular"
      />
      <Stack spacing={1} sx={{ px: 1, py: 2 }}>
        <Skeleton height={16} variant="text" width="80%" />
        <Skeleton height={14} variant="text" width={64} />
      </Stack>
    </Box>
  )
}

function CategorySectionSkeleton({ cards }: { cards: number }) {
  return (
    <CardGrid
      columns="outfit"
      header={
        <>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Skeleton height={24} variant="text" width={180} />
            <Skeleton height={24} variant="rounded" width={64} />
          </Stack>
          <Skeleton height={4} sx={{ mt: 1 }} variant="rectangular" />
          <Divider sx={{ mt: 1, mb: 2 }} />
        </>
      }
    >
      {Array.from({ length: cards }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </CardGrid>
  )
}

export default function SeasonLoading() {
  return (
    <Stack spacing={4}>
      <Skeleton height={40} variant="text" width="40%" />

      <SimpleGrid columns={{ xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }} sx={{ rowGap: 2 }}>
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </SimpleGrid>

      <CategorySectionSkeleton cards={6} />
      <CategorySectionSkeleton cards={4} />
    </Stack>
  )
}
