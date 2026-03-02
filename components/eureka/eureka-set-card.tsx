import { EurekaSet } from '@/lib/types/types'

import EurekaHeader from './eureka-header'
import { Card, CardActionArea } from '@mui/material'

export default function EurekaSetCard({
  eurekaSet,
  isLoggedIn,
}: {
  eurekaSet: EurekaSet
  isLoggedIn: boolean
}) {
  return (
    <Card>
      <CardActionArea href={`/eureka/${eurekaSet.slug}`}>
        <EurekaHeader eurekaSet={eurekaSet} isLoggedIn={isLoggedIn} />
      </CardActionArea>
    </Card>
  )
}
