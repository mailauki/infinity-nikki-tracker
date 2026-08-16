'use client'

import { memo, ReactNode, useState } from 'react'
import { MakeupEvolution, MakeupSet, MakeupVariant } from '@/lib/types/makeup'
import { isStandaloneMakeupSet, STANDALONE_MAKEUP_SLUG } from '@/hooks/makeup'
import { useMakeupData } from '@/components/makeup/makeup-context'
import {
  resolveMakeupImage,
  useMakeupImageMode,
} from '@/components/makeup/makeup-image-mode-context'
import ToggleIcon from '@/components/toggle-icon'
import ProgressChip from '@/components/progress-chip'
import SetCard from '@/components/set-card'

function MakeupSetCard({
  set,
  evolution = null,
  isLoggedIn,
  obtained,
  total,
  variants,
  isMissingFilter = false,
}: {
  set: MakeupSet
  // When provided, the card represents this evolution of the set (its image,
  // title, and link); otherwise it represents the base set.
  evolution?: MakeupEvolution | null
  isLoggedIn: boolean
  obtained: number
  total: number
  // The variants making up this evolution group. Passed as data rather than as
  // a prebuilt `onToggle` closure so the prop list stays free of per-render
  // function identities, which would defeat the `memo` wrapper below.
  variants: MakeupVariant[]
  // When the "missing" filter is active, completing this group animates the card
  // out so it leaves the filtered view smoothly instead of vanishing instantly.
  // It is also the only condition under which the card can animate at all, so it
  // decides whether CardShell mounts a Grow — see components/card-shell.tsx.
  isMissingFilter?: boolean
}) {
  const { onBatchToggleObtained, onHoldExit } = useMakeupData()
  const { mode } = useMakeupImageMode()
  // The ONE card animation that survives: set by `handleToggle` under the
  // "missing" filter so completing a group animates out instead of vanishing.
  // Hide-evolutions / hide-glow-ups no longer animate — the filter pipeline in
  // `filter-outfits.tsx` culls those variants outright, like every other filter.
  const [exiting, setExiting] = useState(false)

  function handleToggle() {
    // Batch-toggle the whole group: when fully obtained, clear it; otherwise
    // mark the remaining (not-yet-obtained) variants obtained.
    const allObtained = variants.every((v) => v.obtained === true)
    const toToggle = variants
      .filter((v) => v.obtained === allObtained)
      .map((v) => ({
        makeup_set: v.makeup_set ?? STANDALONE_MAKEUP_SLUG,
        makeup_category: v.makeup_category!,
        makeup_variant: v.slug,
      }))
    onBatchToggleObtained(toToggle, !allObtained)
    if (isMissingFilter) {
      // The optimistic update culls this card from the filtered list in this
      // same commit, so hold its key until the Grow has played out.
      onHoldExit(variants.map((v) => v.slug))
      setExiting(true)
    }
  }

  // Evolution slugs are independent, opaque strings (no shared prefix with the
  // base set's slug), unlike outfits where an evolution slug is `{baseSlug}-{suffix}`.
  // Pass it through whole as a query param instead of splicing it into the path.
  const detailHref = evolution
    ? `/makeup/${set.slug}?evolution=${evolution.slug}`
    : `/makeup/${set.slug}?evolution=base`
  // The standalone bucket is a client-side pseudo-set whose slug is not in
  // makeup_sets, so it has no detail route. Pieces are toggled inline instead.
  const href = isStandaloneMakeupSet(set) ? '' : detailHref
  // MakeupEvolution titles are stored pre-composed as "{base set title}: {subtitle}".
  const title = evolution ? evolution.title : set.title

  const imageSrc = evolution
    ? resolveMakeupImage(mode, { image: evolution.image_url, alt: evolution.alt_image_url })
    : resolveMakeupImage(mode, { image: set.image_url, alt: set.alt_image_url })
  // The alt toggle switches the whole grid to the square (1/1) layout, so the
  // layout follows the mode alone — not whether this card happens to have an alt
  // image. `resolveMakeupImage` already falls back to the main image when alt is
  // missing, so cards with no alt (or no image at all) still adopt the 1/1 layout.
  const showAlt = mode === 'alt'

  let topLeftBadge: ReactNode = undefined
  if (evolution) {
    topLeftBadge = <ToggleIcon image="/icons/evolution.png" size="xs" title="evolution" />
  }

  return (
    <SetCard
      unmountOnExit
      animateExit={isMissingFilter}
      href={href}
      imageSrc={imageSrc || set.image_url || ''}
      in={!exiting}
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

// Default shallow comparison. Most props are primitives or memo-stable objects,
// but `variants` is a fresh `.filter()` allocation per render in filter-outfits,
// so this memo does NOT currently skip re-renders driven by the parent. It only
// skips when FilterOutfits itself doesn't re-render. Hoisting that per-group
// filter into the `filteredSets` memo would make it fully effective.
export default memo(MakeupSetCard)
