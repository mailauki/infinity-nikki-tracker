import { Box, Container, Divider, Skeleton, Stack } from '@mui/material'

function GroupHeaderSkeleton() {
  return (
    <Box sx={{ gridColumn: { xs: '1/4', sm: '1/5', md: '1/6' }, mt: 2 }}>
      <Stack alignItems="flex-end" direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Skeleton height={28} variant="text" width={120} />
        <Skeleton height={24} variant="rounded" width={60} />
      </Stack>
      <Divider />
    </Box>
  )
}

function VariantCardSkeleton() {
  return (
    <Skeleton
      height={0}
      style={{ paddingBottom: '133%' }}
      sx={{ borderRadius: 1 }}
      variant="rectangular"
      width="100%"
    />
  )
}

export default function EurekaLoading() {
  return (
    <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
      <Skeleton height={20} sx={{ mt: 2, mb: 0.5 }} variant="text" width={100} />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr 1fr 1fr',
            sm: '1fr 1fr 1fr 1fr',
            md: '1fr 1fr 1fr 1fr 1fr',
          },
          gap: { xs: 1, sm: 1.5, md: 2 },
          mb: 4,
        }}
      >
        <GroupHeaderSkeleton />
        {Array.from({ length: 5 }).map((_, i) => (
          <VariantCardSkeleton key={i} />
        ))}
        <GroupHeaderSkeleton />
        {Array.from({ length: 4 }).map((_, i) => (
          <VariantCardSkeleton key={i} />
        ))}
        <GroupHeaderSkeleton />
        {Array.from({ length: 3 }).map((_, i) => (
          <VariantCardSkeleton key={i} />
        ))}
      </Box>
    </Container>
  )
}
