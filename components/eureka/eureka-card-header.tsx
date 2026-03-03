import { countObtained, percent } from '@/hooks/count'
import { EurekaSet } from '@/lib/types/types'
import { Chip } from '@mui/material'

import EurekaCardContent from './eureka-card-content'
import EurekaCardProgress from './eureka-card-progress'
import EurekaSetImage from './eureka-set-image'

export default function EurekaCardHeader({
  eurekaSet,
  isLoggedIn,
}: {
  eurekaSet: EurekaSet
  isLoggedIn: boolean
}) {
  const obtainedCount = countObtained(eurekaSet.eureka_variants)
  const percentage = percent(obtainedCount.obtained, obtainedCount.total)

  return (
    <>
      <EurekaSetImage
        imageUrl={eurekaSet.image_url!}
        alt={eurekaSet.name}
        action={<Chip label={eurekaSet.labels} variant="outlined" size="small" />}
      />
      <EurekaCardContent name={eurekaSet.name} quality={eurekaSet.quality} />
      {isLoggedIn && <EurekaCardProgress percentage={percentage} />}
    </>
  )
}
