import { Skeleton } from '@mui/material'

import CardGrid from '@/components/card-grid'

export default function MomoCloaksLoading() {
  return (
    <CardGrid columns="outfit">
      {Array.from({ length: 12 }, (_, i) => (
        <Skeleton
          key={i}
          height={0}
          style={{ paddingBottom: '150%' }}
          sx={{ borderRadius: 1 }}
          variant="rectangular"
          width="100%"
        />
      ))}
    </CardGrid>
  )
}
