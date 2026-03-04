import { EurekaSet } from '@/lib/types/types'

import { Card, CardActionArea } from '@mui/material'
import EurekaCard from './eureka-card'

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
        <EurekaCard eurekaSet={eurekaSet} isLoggedIn={isLoggedIn} />
      </CardActionArea>
    </Card>
  )
}
