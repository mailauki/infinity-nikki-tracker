'use client'

import { Box } from '@mui/material'
import { EurekaSet } from '@/lib/types/eureka'

import EurekaButton from './eureka-button'

export default function EurekaVariantGrid({
  eurekaSet,
  isLoggedIn,
}: {
  eurekaSet: EurekaSet
  isLoggedIn: boolean
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
        gap: 2,
      }}
    >
      {eurekaSet.eureka_variants.map((eurekaVariant) => (
        <EurekaButton
          key={eurekaVariant.id}
          eurekaVariant={eurekaVariant}
          isLoggedIn={isLoggedIn}
          size={isLoggedIn ? 'md' : 'sm'}
        />
      ))}
    </Box>
  )
}
