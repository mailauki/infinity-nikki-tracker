'use client'

import { memo, useState } from 'react'
import { OutfitVariant } from '@/lib/types/outfit'
import { toTitle } from '@/lib/utils'
import { useOutfitData } from '@/components/outfits/outfit-context'
import { useOutfitImageMode } from '@/components/outfits/outfit-image-mode-context'
import ToggleIcon from '@/components/toggle-icon'
import VariantCard from '@/components/variant-card'

function OutfitVariantCard({
  outfitVariant,
  isLoggedIn,
  isMissingFilter = false,
  disableToggle = false,
}: {
  outfitVariant: OutfitVariant
  isLoggedIn: boolean
  isMissingFilter?: boolean
  disableToggle?: boolean
}) {
  const { onToggleObtained } = useOutfitData()
  const { mode } = useOutfitImageMode()
  const [exiting, setExiting] = useState(false)

  // Variants have no poster image, so only alt mode differs from the default.
  const imageSrc =
    (mode === 'alt' && outfitVariant.alt_image_url) || outfitVariant.image_url || undefined

  function onToggle() {
    onToggleObtained(outfitVariant.outfit_set!, outfitVariant.outfit_category!, outfitVariant.slug)
    if (isMissingFilter) {
      setExiting(true)
    }
  }

  const categoryLabel = toTitle(outfitVariant.outfit_category ?? '')

  return (
    <VariantCard
      animateExit={isMissingFilter}
      disableToggle={disableToggle}
      imageAlt={outfitVariant.slug || 'Outfit Variant'}
      imageSrc={imageSrc}
      in={!exiting}
      isLoggedIn={isLoggedIn}
      obtained={!!outfitVariant.obtained}
      subtitle={categoryLabel}
      title={outfitVariant.title || undefined}
      topLeft={<ToggleIcon category={outfitVariant.outfit_category ?? ''} size="xs" />}
      onToggle={onToggle}
    />
  )
}

// Default shallow comparison. Every prop is a primitive except `outfitVariant`,
// whose identity is preserved by the provider/filter memos until the underlying
// variant data changes. The toggle handler is built from context inside the
// component, so no call site passes a per-render closure.
export default memo(OutfitVariantCard)
