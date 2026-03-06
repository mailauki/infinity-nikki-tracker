import { countObtained, percent } from '@/hooks/count-obtained'
import { CardSize } from '@/lib/types/props'
import { EurekaSet } from '@/lib/types/eureka'
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
        alt={eurekaSet.title}
        action={<Chip label={eurekaSet.label} variant="outlined" size="small" />}
        title={eurekaSet.title}
        subheader={`${percentage}%`}
        size={size}
      />
      {size !== 'sm' && (
        <EurekaCardContent
          title={eurekaSet.title}
          rarity={eurekaSet.rarity}
          size={size}
          trial={eurekaSet.trial}
          style={eurekaSet.style}
        />
      )}
      {isLoggedIn && <EurekaCardProgress percentage={percentage} size={size} />}
    </>
  )
}
