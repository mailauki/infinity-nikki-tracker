'use client'

import { useState } from 'react'
import { MakeupSet } from '@/lib/types/makeup'
import SlugToolBar from '@/components/navbar/slug-toolbar'
import PageShell from '@/components/page-shell'
import SidebarBody from '@/components/sidebar/sidebar-body'
import MakeupEvolutionVariants from './makeup-evolution-variants'
import MakeupSetDetailCard from './makeup-set-detail-card'
import MakeupToggleBar from './makeup-toggle-bar'
import {
  resolveMakeupImage,
  useMakeupImageMode,
} from '@/components/makeup/makeup-image-mode-context'
import { useMakeupData } from '@/components/makeup/makeup-context'
import { useSearchParams } from 'next/navigation'

export default function MakeupSetDetail({
  makeupSet,
  isLoggedIn,
  isAdmin,
}: {
  makeupSet: MakeupSet
  isLoggedIn: boolean
  isAdmin: boolean
}) {
  const { evolutions, makeup_variants: rawVariants } = makeupSet
  const { mode } = useMakeupImageMode()
  const { obtainedMakeup } = useMakeupData()

  const makeup_variants = rawVariants.map((v) => ({
    ...v,
    obtained: obtainedMakeup.some((o) => o.makeup_variant === v.slug),
  }))

  const searchParams = useSearchParams()
  const evolutionParams = searchParams.get('evolution')
  // The base state's slug is the bare set slug (no `{set}-base`), so `evolution=base`
  // seeds the set slug itself; every other evolution seeds `{set}-{evolution}`.
  const resolveEvolutionSlug = () => {
    if (!evolutionParams) return null
    if (evolutionParams === 'base') return makeupSet.slug
    return `${makeupSet.slug}-${evolutionParams}`
  }
  const [selected, setSelected] = useState<string | null>(resolveEvolutionSlug())

  function handleSelectEvolution(slug: string | null) {
    setSelected(slug)
  }

  const selectedEvolution = evolutions.find((e) => e.slug === selected) ?? null

  const image = selectedEvolution ? selectedEvolution.image_url : makeupSet.image_url
  const alt = selectedEvolution ? selectedEvolution.alt_image_url : makeupSet.alt_image_url

  const imageSrc = resolveMakeupImage(mode, { image, alt })
  const showingAlt = mode === 'alt' && !!alt

  // Scope progress to the current selection so the card's chip matches the grid.
  const scopedVariants = makeup_variants.filter((v) => !selected || v.makeup_set === selected)
  const obtained = scopedVariants.reduce((sum, v) => sum + (v.obtained ? 1 : 0), 0)
  const total = scopedVariants.length

  return (
    <>
      <SlugToolBar isAdmin={isAdmin} />
      <MakeupToggleBar
        isLoggedIn={isLoggedIn}
        makeupSet={makeupSet}
        obtained={obtained}
        selected={selected}
        total={total}
        onSelect={handleSelectEvolution}
      />
      <SidebarBody>
        <MakeupSetDetailCard
          imageSrc={imageSrc}
          isLoggedIn={isLoggedIn}
          makeupSet={makeupSet}
          obtained={obtained}
          selected={selected && evolutions.length > 0 ? selected : null}
          showingAlt={showingAlt}
          total={total}
        />
      </SidebarBody>

      <PageShell maxWidth="wide">
        <MakeupEvolutionVariants
          isLoggedIn={isLoggedIn}
          makeupSet={makeupSet}
          selected={evolutions.length > 0 ? selected : null}
        />
      </PageShell>
    </>
  )
}
