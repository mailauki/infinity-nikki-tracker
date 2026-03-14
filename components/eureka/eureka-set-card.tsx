'use client'

import { EurekaSet } from '@/lib/types/eureka'
import { Card, CardActionArea } from '@mui/material'
import EurekaCard from './eureka-card'
import { CardSize } from '@/lib/types/props'

export default function EurekaSetCard({
  eurekaSet,
  isLoggedIn,
  size = 'sm',
}: {
  eurekaSet: EurekaSet
  isLoggedIn: boolean
  size?: CardSize
}) {
  return (
    <Card>
      <CardActionArea href={`/eureka/${eurekaSet.slug}`}>
        <EurekaCard eurekaSet={eurekaSet} isLoggedIn={isLoggedIn} size={size} />
      </CardActionArea>
    </Card>
  )
}
