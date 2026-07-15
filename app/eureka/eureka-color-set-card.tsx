'use client'

import { useEffect, useState } from 'react'
import { countObtained } from '@/hooks/count-obtained'
import { EurekaColor, EurekaSet } from '@/lib/types/eureka'
import { useEurekaData } from '@/components/eureka/eureka-context'
import ProgressChip from '@/components/progress-chip'
import SetCard from '@/components/set-card'

export default function EurekaColorSetCard({
  eurekaSet,
  color,
  isLoggedIn,
}: {
  eurekaSet: EurekaSet
  color: EurekaColor
  isLoggedIn: boolean
}) {
  const { onBatchToggleObtained } = useEurekaData()
  const [grown, setGrown] = useState(false)

  useEffect(() => setGrown(true), [])

  const variants = eurekaSet.eureka_variants.filter((variant) => variant.color === color.slug)
  const { obtained, total } = countObtained(variants)

  function handleToggle() {
    onBatchToggleObtained(
      variants.map((variant) => ({
        eureka_set: variant.eureka_set!,
        category: variant.category!,
        color: variant.color!,
      })),
      obtained !== total
    )
  }

  return (
    <SetCard
      href={`/eureka/${eurekaSet.slug}`}
      imageSrc={variants[0].image_url ?? ''}
      in={grown}
      isLoggedIn={isLoggedIn}
      obtained={obtained}
      rarity={eurekaSet.rarity ?? 0}
      showAlt={true}
      title={color.title ?? ''}
      topRight={
        isLoggedIn ? <ProgressChip obtained={obtained} total={total} variant="parts" /> : undefined
      }
      total={total}
      onToggle={handleToggle}
    />
  )
}
