'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { EurekaSet } from '@/lib/types/eureka'
import { countObtained } from '@/hooks/count-obtained'
import { isVariantObtained } from '@/hooks/eureka'
import { useEurekaData } from '@/components/eureka/eureka-context'
import SlugToolBar from '@/components/slug-toolbar'
import PageShell from '@/components/page-shell'
import SidebarBody from '@/components/sidebar/sidebar-body'
import EurekaSetDetailCard from './eureka-set-detail-card'
import EurekaVariantColorFilter from './eureka-variant-color-filter'

export default function EurekaSetDetail({
  eurekaSet,
  isLoggedIn,
  isAdmin,
}: {
  eurekaSet: EurekaSet
  isLoggedIn: boolean
  isAdmin: boolean
}) {
  const { obtainedKeys } = useEurekaData()
  const { colors, eureka_variants } = eurekaSet

  const searchParams = useSearchParams()
  const colorParam = searchParams.get('color')
  const initialColor = colors.some((c) => c.slug === colorParam) ? colorParam : null
  // Selected color is owned here so both the sidebar detail card and the main
  // color filter/grid react to it — the card mirrors the selected color's image
  // and scopes its progress to that color.
  const [selectedColor, setSelectedColor] = useState<string | null>(initialColor)

  function toggleColor(slug: string) {
    setSelectedColor((prev) => (prev === slug ? null : slug))
  }

  // Progress is computed against the live obtained set so the sidebar chip stays
  // in sync with optimistic toggles, matching the outfit detail page. When a
  // color is selected, both the image and the progress narrow to that color.
  const variantsWithObtained = eureka_variants.map((v) => ({
    ...v,
    obtained: isVariantObtained(v, obtainedKeys),
  }))
  const scopedVariants =
    selectedColor === null
      ? variantsWithObtained
      : variantsWithObtained.filter((v) => v.color === selectedColor)
  const { obtained, total } = countObtained(scopedVariants)

  const colorImage =
    selectedColor === null ? null : (scopedVariants.find((v) => v.image_url)?.image_url ?? null)

  return (
    <>
      <SlugToolBar isAdmin={isAdmin} />
      <SidebarBody>
        <EurekaSetDetailCard
          colorImage={colorImage}
          eurekaSet={eurekaSet}
          isLoggedIn={isLoggedIn}
          obtained={obtained}
          total={total}
        />
      </SidebarBody>

      <PageShell maxWidth="wide">
        <EurekaVariantColorFilter
          colors={colors}
          eureka_variants={eureka_variants}
          isLoggedIn={isLoggedIn}
          selectedColor={selectedColor}
          onToggleColor={toggleColor}
        />
      </PageShell>
    </>
  )
}
