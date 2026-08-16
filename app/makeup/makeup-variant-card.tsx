'use client'

import { memo, useState } from 'react'
import { MakeupVariant } from '@/lib/types/makeup'
import { STANDALONE_MAKEUP_SLUG } from '@/hooks/makeup'
import { toTitle } from '@/lib/utils'
import { useMakeupData } from '@/components/makeup/makeup-context'
import { useMakeupImageMode } from '@/components/makeup/makeup-image-mode-context'
import ToggleIcon from '@/components/toggle-icon'
import VariantCard from '@/components/variant-card'

function MakeupVariantCard({
  makeupVariant,
  isLoggedIn,
  isMissingFilter = false,
  disableToggle = false,
}: {
  makeupVariant: MakeupVariant
  isLoggedIn: boolean
  isMissingFilter?: boolean
  disableToggle?: boolean
}) {
  const { onToggleObtained, onHoldExit } = useMakeupData()
  const { mode } = useMakeupImageMode()
  const [exiting, setExiting] = useState(false)

  // Variants have no poster image, so only alt mode differs from the default.
  const imageSrc =
    (mode === 'alt' && makeupVariant.alt_image_url) || makeupVariant.image_url || undefined

  function onToggle() {
    onToggleObtained(
      makeupVariant.makeup_set ?? STANDALONE_MAKEUP_SLUG,
      makeupVariant.makeup_category!,
      makeupVariant.slug
    )
    if (isMissingFilter) {
      // The optimistic update culls this card from the filtered list in this
      // same commit, so hold its key until the Grow has played out.
      onHoldExit([makeupVariant.slug])
      setExiting(true)
    }
  }

  const categoryLabel = toTitle(makeupVariant.makeup_category ?? '')

  return (
    <VariantCard
      animateExit={isMissingFilter}
      disableToggle={disableToggle}
      imageAlt={makeupVariant.slug || 'Makeup Variant'}
      imageSrc={imageSrc}
      in={!exiting}
      isLoggedIn={isLoggedIn}
      obtained={!!makeupVariant.obtained}
      subtitle={categoryLabel}
      title={makeupVariant.title || undefined}
      topLeft={<ToggleIcon category={makeupVariant.makeup_category ?? ''} size="xs" />}
      onToggle={onToggle}
    />
  )
}

// Default shallow comparison. Every prop is a primitive except `makeupVariant`,
// whose identity is preserved by the provider/filter memos until the underlying
// variant data changes. The toggle handler is built from context inside the
// component, so no call site passes a per-render closure.
export default memo(MakeupVariantCard)
