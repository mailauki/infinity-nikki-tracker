import { EurekaSet } from '@/lib/types/types'

import EurekaCardHeader from './eureka-card-header'
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
        <EurekaCardHeader eurekaSet={eurekaSet} isLoggedIn={isLoggedIn} />
      </CardActionArea>
    </Card>
  )
}
