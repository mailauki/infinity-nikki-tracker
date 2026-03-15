import { countObtained, percent } from '@/hooks/count-obtained'
import { CardSize } from '@/lib/types/props'
import { EurekaSet } from '@/lib/types/eureka'
import { toTitle } from '@/lib/utils'
import { Chip } from '@mui/material'

import EurekaCardContent from './eureka-card-content'
import EurekaCardProgress from './eureka-card-progress'
import EurekaSetImage from './eureka-set-image'

export default function EurekaCard({
  eurekaSet,
  isLoggedIn,
  size,
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
        action={eurekaSet.label ? <Chip label={toTitle(eurekaSet.label)} size="small" variant="outlined" /> : null}
        alt={eurekaSet.title}
        imageUrl={eurekaSet.image_url!}
        size={size}
        subheader={isLoggedIn ? `${percentage}%` : undefined}
        title={eurekaSet.title}
      />
      {size !== 'sm' && (
        <EurekaCardContent
          rarity={eurekaSet.rarity}
          size={size}
          style={toTitle(eurekaSet.style ?? '')}
          title={eurekaSet.title}
          trial={toTitle(eurekaSet.eureka_set_trials?.[0]?.trial ?? '')}
        />
      )}
      {isLoggedIn && <EurekaCardProgress percentage={percentage} size={size} />}
    </>
  )
}
