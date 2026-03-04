'use client'

import { Grid } from '@mui/material'
import { EurekaSet } from '@/lib/types/types'

import EurekaButton from './eureka-button'

export default function EurekaVariantGrid({
  eurekaSet,
  isLoggedIn,
}: {
  eurekaSet: EurekaSet
  isLoggedIn: boolean
}) {
  return (
    <Grid container spacing={2} sx={{ pb: 8 }}>
      {eurekaSet.eureka_variants.map((eurekaVariant) => (
        <Grid key={eurekaVariant.id} size={4}>
          <EurekaButton eurekaVariant={eurekaVariant} isLoggedIn={isLoggedIn} />
        </Grid>
      ))}
    </Grid>
  )
}
