'use client'

import { ReactNode, useEffect, useState } from 'react'
import { Evolution, OutfitSet } from '@/lib/types/outfit'
import { isGlowup } from '@/hooks/outfit'
import { toTitle } from '@/lib/utils'
import {
  resolveOutfitImage,
  useOutfitImageMode,
} from '@/components/outfits/outfit-image-mode-context'
import ToggleIcon from '@/components/toggle-icon'
import ProgressChip from '@/components/progress-chip'
import SetCard from '@/components/set-card'

export default function OutfitSetCard({
  set,
  evolution = null,
  isLoggedIn,
  obtained,
  total,
  onToggle,
  isMissingFilter = false,
  shouldHide = false,
}: {
  set: OutfitSet
  // When provided, the card represents this evolution of the set (its image,
  // title, and link); otherwise it represents the base set.
  evolution?: Evolution | null
  isLoggedIn: boolean
  obtained: number
  total: number
  onToggle: () => void
  // When the "missing" filter is active, completing this group animates the
  // card out (the obtained toggle is committed in onExited) so it leaves the
  // filtered view smoothly instead of vanishing instantly.
  isMissingFilter?: boolean
  // When true (e.g. an evolution card while "hide evolutions" is active), the
  // card animates out and stays unmounted.
  shouldHide?: boolean
}) {
  const { mode } = useOutfitImageMode()
  const [grown, setGrown] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => setGrown(true), [])

  // Animate out when this card should be hidden by a filter change, and grow
  // back in when the filter is cleared.
  useEffect(() => {
    setExiting(shouldHide)
  }, [shouldHide])

  function handleToggle() {
    onToggle()
    if (isMissingFilter) {
      setExiting(true)
    }
  }

  const href = evolution
    ? `/outfits/${evolution.slug.replace('-', '?evolution=')}`
    : `/outfits/${set.slug}`
  const title = evolution ? `${set.title}: ${toTitle(evolution.title)}` : set.title

  const imageSrc = evolution
    ? resolveOutfitImage(mode, { image: evolution.image_url, alt: evolution.alt_image_url })
    : resolveOutfitImage(mode, { image: set.image_url, alt: set.alt_image_url })
  // The alt toggle switches the whole grid to the square (1/1) layout, so the
  // layout follows the mode alone — not whether this card happens to have an alt
  // image. `resolveOutfitImage` already falls back to the main image when alt is
  // missing, so cards with no alt (or no image at all) still adopt the 1/1 layout.
  const showAlt = mode === 'alt'

  const glowup = !!evolution && isGlowup(evolution)

  let topLeftBadge: ReactNode = undefined
  if (glowup) {
    topLeftBadge = <ToggleIcon image="/icons/glowup.png" size="xs" title="glowup" />
  } else if (evolution) {
    topLeftBadge = <ToggleIcon image="/icons/evolution.png" size="xs" title="evolution" />
  }

  return (
    <SetCard
      unmountOnExit
      href={href}
      imageSrc={imageSrc || set.image_url || ''}
      in={grown && !exiting}
      isLoggedIn={isLoggedIn}
      obtained={obtained}
      rarity={set.rarity}
      showAlt={showAlt}
      title={title}
      topLeft={topLeftBadge}
      topRight={
        isLoggedIn ? <ProgressChip obtained={obtained} total={total} variant="parts" /> : undefined
      }
      total={total}
      onToggle={handleToggle}
    />
  )
}
