'use client'

import { useState } from 'react'
import { OutfitSet } from '@/lib/types/outfit'
import SlugToolBar from '@/components/navbar/slug-toolbar'
import PageShell from '@/components/page-shell'
import SidebarBody from '@/components/sidebar/sidebar-body'
import OutfitEvolutionVariants from './outfit-evolution-variants'
import OutfitSetDetailCard from './outfit-set-detail-card'
import OutfitToggleBar from './outfit-toggle-bar'
import {
  resolveOutfitImage,
  useOutfitImageMode,
} from '@/components/outfits/outfit-image-mode-context'
import { matchesOutfitFilter } from '@/hooks/outfit'
import { useOutfitData } from '@/components/outfits/outfit-context'
import { useSearchParams } from 'next/navigation'

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

  const searchParams = useSearchParams()
  const evolutionParams = searchParams.get('evolution')
  // The base state's slug is the bare set slug (no `{set}-base`), so `evolution=base`
  // seeds the set slug itself; every other evolution seeds `{set}-{evolution}`.
  const resolveEvolutionSlug = () => {
    if (!evolutionParams) return null
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

  // Scope progress to the current filters so the card's chip matches the grid.
  const scopedVariants = outfit_variants.filter((v) => matchesOutfitFilter(v, selected))
  const obtained = scopedVariants.reduce((sum, v) => sum + (v.obtained ? 1 : 0), 0)
  const total = scopedVariants.length

  return (
    <>
      <SlugToolBar isAdmin={isAdmin} />
      <OutfitToggleBar
        isLoggedIn={isLoggedIn}
        obtained={obtained}
        outfitSet={outfitSet}
        selected={selected}
        total={total}
        onSelect={handleSelectEvolution}
      />
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

      <PageShell maxWidth="wide">
        <OutfitEvolutionVariants
          isLoggedIn={isLoggedIn}
          outfitSet={outfitSet}
          selected={evolutions.length > 0 ? selected : null}
        />
      </PageShell>
    </>
  )
}
