'use client'

import { useState } from 'react'
import { OutfitSet } from '@/lib/types/outfit'
import SlugToolBar from '@/components/slug-toolbar'
import PageShell from '@/components/page-shell'
import SidebarBody from '@/components/sidebar/sidebar-body'
import OutfitEvolutionVariants from './outfit-evolution-variants'
import OutfitSetDetailCard from './outfit-set-detail-card'
import {
  resolveOutfitImage,
  useOutfitImageMode,
} from '@/components/outfits/outfit-image-mode-context'
import { useOutfitData } from '@/components/outfits/outfit-context'
import { useSearchParams } from 'next/navigation'

// The standalone-pieces set is a container of individually-authored variants
// with no cohesive identity, so its detail card is hidden and its toggle
// filters by outfit category instead of evolution state.
const STANDALONE_SLUG = 'standalone-pieces'

export default function OutfitSetDetail({
  outfitSet,
  isLoggedIn,
  isAdmin,
}: {
  outfitSet: OutfitSet
  isLoggedIn: boolean
  isAdmin: boolean
}) {
  const { evolutions, outfit_variants: rawVariants } = outfitSet
  const { mode } = useOutfitImageMode()
  const { obtainedOutfit } = useOutfitData()

  const outfit_variants = rawVariants.map((v) => ({
    ...v,
    obtained: obtainedOutfit.some((o) => o.outfit_variant === v.slug),
  }))

  const isStandalone = outfitSet.slug === STANDALONE_SLUG

  const searchParams = useSearchParams()
  const evolutionParams = searchParams.get('evolution')
  // Standalone has no evolution states, so never seed a selection from the param.
  // The base state's slug is the bare set slug (no `{set}-base`), so `evolution=base`
  // seeds the set slug itself; every other evolution seeds `{set}-{evolution}`.
  const resolveEvolutionSlug = () => {
    if (isStandalone || !evolutionParams) return null
    if (evolutionParams === 'base') return outfitSet.slug
    return `${outfitSet.slug}-${evolutionParams}`
  }
  const [selected, setSelected] = useState<string | null>(resolveEvolutionSlug())
  const [showCarousel, setShowCarousel] = useState(false)

  function handleSelectEvolution(slug: string | null) {
    setSelected(slug)
    setShowCarousel(false)
  }

  const selectedEvolution = evolutions.find((e) => e.slug === selected) ?? null

  const image = selectedEvolution ? selectedEvolution.image_url : outfitSet.image_url
  const alt = selectedEvolution ? selectedEvolution.alt_image_url : outfitSet.alt_image_url

  const imageSrc = resolveOutfitImage(mode, { image, alt })
  const showingAlt = mode === 'alt' && !!alt

  const carouselImages = selectedEvolution
    ? (selectedEvolution.carousel_images ?? [])
    : [
        ...(outfitSet.carousel_images ?? []),
        ...outfitSet.evolutions.flatMap((e) => e.carousel_images ?? []),
      ]
  const hasCarousel = carouselImages.length > 0

  const obtained = outfit_variants.reduce((sum, v) => sum + (v.obtained ? 1 : 0), 0)
  const total = outfit_variants.length

  return (
    <>
      <SlugToolBar isAdmin={isAdmin} />
      {!isStandalone && (
        <SidebarBody>
          <OutfitSetDetailCard
            carouselImages={carouselImages}
            hasCarousel={hasCarousel}
            imageSrc={imageSrc}
            isLoggedIn={isLoggedIn}
            obtained={obtained}
            outfitSet={outfitSet}
            selected={selected && evolutions.length > 0 ? selected : null}
            showCarousel={showCarousel}
            showingAlt={showingAlt}
            total={total}
            onToggleCarousel={() => setShowCarousel((v) => !v)}
          />
        </SidebarBody>
      )}

      <PageShell maxWidth="wide">
        <OutfitEvolutionVariants
          isLoggedIn={isLoggedIn}
          isStandalone={isStandalone}
          outfitSet={outfitSet}
          selected={selected && evolutions.length > 0 ? selected : null}
          onSelect={handleSelectEvolution}
        />
      </PageShell>
    </>
  )
}
