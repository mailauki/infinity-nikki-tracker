'use client'

import { memo, ReactNode, useEffect, useState } from 'react'
import { Evolution, OutfitSet, OutfitVariant } from '@/lib/types/outfit'
import { isGlowup } from '@/hooks/outfit'
import { toTitle } from '@/lib/utils'
import { useOutfitData } from '@/components/outfits/outfit-context'
import {
  resolveOutfitImage,
  useOutfitImageMode,
} from '@/components/outfits/outfit-image-mode-context'
import ToggleIcon from '@/components/toggle-icon'
import ProgressChip from '@/components/progress-chip'
import SetCard from '@/components/set-card'

function OutfitSetCard({
  set,
  evolution = null,
  isLoggedIn,
  obtained,
  total,
  variants,
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
  // The variants making up this evolution group. Passed as data rather than as
  // a prebuilt `onToggle` closure so the prop list stays free of per-render
  // function identities, which would defeat the `memo` wrapper below.
  variants: OutfitVariant[]
  // When the "missing" filter is active, completing this group animates the
  // card out (the obtained toggle is committed in onExited) so it leaves the
  // filtered view smoothly instead of vanishing instantly.
  isMissingFilter?: boolean
  // When true (e.g. an evolution card while "hide evolutions" is active), the
  // card animates out and stays unmounted.
  shouldHide?: boolean
}) {
  const { onBatchToggleObtained } = useOutfitData()
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
    // Batch-toggle the whole group: when fully obtained, clear it; otherwise
    // mark the remaining (not-yet-obtained) variants obtained.
    const allObtained = variants.every((v) => v.obtained === true)
    const toToggle = variants
      .filter((v) => v.obtained === allObtained)
      .map((v) => ({
        outfit_set: v.outfit_set!,
        outfit_category: v.outfit_category!,
        outfit_variant: v.slug,
      }))
    onBatchToggleObtained(toToggle, !allObtained)
    if (isMissingFilter) {
      setExiting(true)
    }
  }

  const href = evolution
    ? `/outfits/${evolution.slug.replace('-', '?evolution=')}`
    : `/outfits/${set.slug}?evolution=base`
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

// Default shallow comparison: every prop is either a primitive or an object
// whose identity is preserved by the provider/filter memos until its underlying
// data actually changes.
export default memo(OutfitSetCard)
