import { Card, CardContent, CardHeader, Divider, Skeleton, Stack } from '@mui/material'
import { SimpleGrid } from '@/components/card-grid'

function ProfileHeaderSkeleton() {
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
      <Skeleton height={140} variant="circular" width={140} />
      <Stack spacing={0.5}>
        <Skeleton height={28} variant="text" width={160} />
        <Skeleton height={20} variant="text" width={100} />
        <Skeleton height={20} variant="text" width={180} />
      </Stack>
    </Stack>
  )
}

// Mirrors ProfileStats: a row of four centered stat pairs split by dividers.
function ProfileStatsSkeleton() {
  return (
    <Stack
      direction="row"
      divider={<Divider flexItem orientation="vertical" variant="middle" />}
      spacing={{ xs: 1, sm: 2, md: 3 }}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <Stack key={i} spacing={0.5} sx={{ alignItems: 'center', flexGrow: { xs: 1, md: 0 } }}>
          <Skeleton height={16} variant="text" width={72} />
          <Skeleton height={28} variant="text" width={40} />
        </Stack>
      ))}
    </Stack>
  )
}

// Mirrors ChartCard: overline header + a chart square beside a stacked legend
// that wraps below on narrow cards.
function ChartCardSkeleton() {
  return (
    <Card variant="outlined">
      <CardHeader
        slotProps={{ title: { variant: 'overline' } }}
        sx={{ mt: -1 }}
        title={<Skeleton height={16} variant="text" width={140} />}
      />
      <CardContent sx={{ pt: 0 }}>
        <Stack
          useFlexGap
          direction="row"
          spacing={2}
          sx={{ alignItems: 'center', flexWrap: 'wrap' }}
        >
          <Skeleton
            height={200}
            sx={{ flexGrow: 1, flexShrink: 0, minWidth: '200px' }}
            variant="rounded"
            width={200}
          />
          <Stack spacing={1.5} sx={{ flexGrow: 1, minWidth: '200px' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Stack key={i} spacing={0.5}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Skeleton height={12} variant="rounded" width={12} />
                  <Skeleton height={16} sx={{ flex: 1 }} variant="text" />
                  <Skeleton height={20} variant="rounded" width={48} />
                </Stack>
                <Skeleton height={4} sx={{ ml: 3 }} variant="rounded" />
              </Stack>
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

function RecentUpdatesSkeleton() {
  return (
    <Card variant="outlined">
      <CardHeader
        slotProps={{ title: { variant: 'overline' } }}
        sx={{ pb: 0 }}
        title={<Skeleton height={20} variant="text" width={140} />}
      />
      <CardContent>
        <Stack spacing={1}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Stack key={i} direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Skeleton height={48} variant="rounded" width={48} />
              <Stack spacing={0.5} sx={{ flex: 1 }}>
                <Skeleton height={18} variant="text" width="60%" />
                <Skeleton height={14} variant="text" width="40%" />
              </Stack>
              <Skeleton height={14} variant="text" width={50} />
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}

export default function ProfileLoading() {
  return (
    <Stack spacing={3} sx={{ flexGrow: 1 }}>
      <ProfileHeaderSkeleton />
      <ProfileStatsSkeleton />
      <SimpleGrid columns={{ sm: '1fr', md: '1fr 1fr' }}>
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </SimpleGrid>
      <RecentUpdatesSkeleton />
    </Stack>
  )
}
