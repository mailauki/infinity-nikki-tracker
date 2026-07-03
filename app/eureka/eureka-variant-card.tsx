'use client'

import { useState } from 'react'
import { toTitle } from '@/lib/utils'
import { EurekaVariant } from '@/lib/types/eureka'
import { useEurekaData } from '@/components/eureka/eureka-context'
import VariantCard from '@/components/variant-card'
import ToggleIcon from '@/components/toggle-icon'

export default function EurekaVariantCard({
  eurekaVariant,
  isLoggedIn,
  isMissingFilter = false,
}: {
  eurekaVariant: EurekaVariant
  isLoggedIn: boolean
  isMissingFilter?: boolean
}) {
  const { onToggleObtained } = useEurekaData()
  const [exiting, setExiting] = useState(false)

  function onToggle() {
    onToggleObtained(eurekaVariant.eureka_set!, eurekaVariant.category!, eurekaVariant.color!)
    if (isMissingFilter) {
      setExiting(true)
    }
  }

  return (
    <VariantCard
      optimized
      imageAlt={eurekaVariant.slug || 'Eureka Variant'}
      imageSrc={eurekaVariant.image_url}
      in={!exiting}
      isLoggedIn={isLoggedIn}
      obtained={!!eurekaVariant.obtained}
      subtitle={toTitle(eurekaVariant.category ?? '')}
      title={toTitle(eurekaVariant.color ?? '')}
      topLeft={<ToggleIcon category={eurekaVariant.category ?? ''} size="xs" />}
      onToggle={onToggle}
    />
  )
}
