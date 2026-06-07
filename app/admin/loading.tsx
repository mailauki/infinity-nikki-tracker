import { Box, Card, CardContent, CardHeader, Skeleton } from '@mui/material'

export default function AdminLoading() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
        gap: 2,
        pt: 4,
      }}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} variant="outlined">
          <CardHeader
            disableTypography
            action={<Skeleton height={32} sx={{ mt: 0.5 }} variant="rounded" width={32} />}
            title={<Skeleton height={24} variant="text" width={120} />}
          />
          <CardContent sx={{ pt: 0 }}>
            <Skeleton height={40} variant="text" width={60} />
          </CardContent>
        </Card>
      ))}
    </Box>
  )
}
