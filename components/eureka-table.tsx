'use client'

import { Grid } from '@mui/material'
import { EurekaSet } from '@/lib/types/types'

import EurekaButton from './eureka-button'

export default function EurekaTable({
  eurekaSet,
  isLoggedIn,
}: {
  eurekaSet: EurekaSet
  isLoggedIn: boolean
}) {
  return (
    <Grid container spacing={2} sx={{ pb: 8 }}>
      {eurekaSet.eureka.map((eureka) => (
        <Grid key={eureka.id} size={4}>
          <EurekaButton eureka={eureka} isLoggedIn={isLoggedIn} />
        </Grid>
      ))}
    </Grid>
  )
}
