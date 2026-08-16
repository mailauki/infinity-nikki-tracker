'use client'

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

  // `in` is pinned true and no `animateExit` is passed: this card has no
  // "missing" filter path, so it never animates out. It used to flip a `grown`
  // flag in an effect to animate every card IN on mount instead — a pattern
  // already removed from the outfit cards (see
  // docs/superpowers/specs/2026-07-30-known-issue-standard-grid-flash.md) that
  // cost an extra render plus a 300ms transition per card, on a page that
  // renders every set at once.
  return (
    <SetCard
      in
      href={`/eureka/${eurekaSet.slug}?color=${color.slug}`}
      imageSrc={variants[0].image_url ?? ''}
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
