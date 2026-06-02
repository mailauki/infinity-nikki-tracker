import { Box, Card, CardContent, CardHeader, Skeleton, Stack } from '@mui/material'

function ProfileHeaderSkeleton() {
  return (
    <Stack alignItems="center" direction="row" spacing={2}>
      <Skeleton height={140} variant="circular" width={140} />
      <Stack spacing={0.5}>
        <Skeleton height={28} variant="text" width={160} />
        <Skeleton height={20} variant="text" width={100} />
        <Skeleton height={20} variant="text" width={180} />
      </Stack>
    </Stack>
  )
}

function StatCardSkeleton() {
  return (
    <Card variant="outlined">
      <CardHeader
        disableTypography
        action={<Skeleton height={24} sx={{ mt: 1 }} variant="rounded" width={60} />}
        sx={{ mt: -1 }}
        title={<Skeleton height={20} variant="text" width={80} />}
      />
      <CardContent sx={{ pt: 0 }}>
        <Skeleton height={8} variant="rounded" />
      </CardContent>
    </Card>
  )
}

function RecentUpdatesSkeleton() {
  return (
    <Card variant="outlined">
      <CardHeader
        disableTypography
        sx={{ pb: 0 }}
        title={<Skeleton height={20} variant="text" width={140} />}
      />
      <CardContent>
        <Stack spacing={1}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Stack key={i} alignItems="center" direction="row" spacing={2}>
              <Skeleton height={48} variant="rounded" width={48} />
              <Stack flex={1} spacing={0.5}>
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
    <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
      <ProfileHeaderSkeleton />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr' },
          gap: 2,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </Box>
      <RecentUpdatesSkeleton />
    </Stack>
  )
}
