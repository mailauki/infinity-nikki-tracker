'use client'

import { MakeupVariant } from '@/lib/types/makeup'
import { toTitle } from '@/lib/utils'
import { useOutfitImageMode } from '@/components/outfits/outfit-image-mode-context'
import ToggleIcon from '@/components/toggle-icon'
import VariantCard from '@/components/variant-card'

// An individually-authored makeup piece, in the same card shape as a standalone
// outfit variant so the two sit together in one category grid. Its badge is the
// piece's own makeup category (lips, eyelashes, …), matching how a standalone
// outfit variant badges its outfit category; full makeup *sets* carry the
// full-makeup icon instead, so the two read apart at a glance.
//
// Read-only, for the same reason MakeupSetCard is: obtained_makeup has no
// provider-backed mutation, so `isLoggedIn={false}` hides VariantCard's toggle
// rather than showing one that silently does nothing. The card still reports
// whether the piece is collected through its raised state.
export default function MakeupPieceCard({ variant }: { variant: MakeupVariant }) {
  const { mode } = useOutfitImageMode()

  // Variants have no poster image, so only alt mode differs from the default.
  const imageSrc = (mode === 'alt' && variant.alt_image_url) || variant.image_url || undefined

  return (
    <VariantCard
      in
      imageAlt={variant.slug || 'Makeup Piece'}
      imageSrc={imageSrc}
      isLoggedIn={false}
      obtained={!!variant.obtained}
      subtitle={toTitle(variant.makeup_category ?? '')}
      title={variant.title || undefined}
      topLeft={<ToggleIcon category={variant.makeup_category ?? ''} size="xs" />}
      onToggle={() => {}}
    />
  )
}
