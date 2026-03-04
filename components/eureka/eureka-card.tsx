import { countObtained, percent } from '@/hooks/count'
import { CardSize, EurekaSet } from '@/lib/types/types'
import { Chip } from '@mui/material'

import EurekaCardContent from './eureka-card-content'
import EurekaCardProgress from './eureka-card-progress'
import EurekaSetImage from './eureka-set-image'

export default function EurekaCard({
  eurekaSet,
  isLoggedIn,
  size = 'md',
}: {
  eurekaSet: EurekaSet
  isLoggedIn: boolean
  size?: CardSize
}) {
  const obtainedCount = countObtained(eurekaSet.eureka_variants)
  const percentage = percent(obtainedCount.obtained, obtainedCount.total)

  return (
    <>
      <EurekaSetImage
        imageUrl={eurekaSet.image_url!}
        alt={eurekaSet.name}
        action={<Chip label={eurekaSet.labels} variant="outlined" size="small" />}
        title={eurekaSet.name}
        subheader={`${percentage}%`}
        size={size}
      />
      {size !== 'sm' && (
        <EurekaCardContent
          name={eurekaSet.name}
          quality={eurekaSet.quality}
          size={size}
          trial={eurekaSet.trial}
          style={eurekaSet.style}
        />
      )}
      {isLoggedIn && <EurekaCardProgress percentage={percentage} size={size} />}
    </>
  )
}
