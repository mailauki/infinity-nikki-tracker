'use client'

import { MakeupSet, MakeupVariant } from '@/lib/types/makeup'
import {
  resolveOutfitImage,
  useOutfitImageMode,
} from '@/components/outfits/outfit-image-mode-context'
import SetCard from '@/components/set-card'
import ProgressChip from '@/components/progress-chip'
import ToggleIcon from '@/components/toggle-icon'

// A makeup card: either the base set (evolution === null) or one of its
// evolutions. Uses the shared SetCard so makeup matches the outfit cards in the
// same grid.
//
// There is no public makeup detail route yet (`/makeup` is a Coming Soon stub),
// so every card links there rather than to a 404. Collection toggling is
// likewise inert: obtained_makeup has no provider-backed mutation, so the card
// reports progress but cannot change it — passing `isLoggedIn={false}` hides
// SetCard's toggle button instead of showing one that does nothing.
export default function MakeupSetCard({
  set,
  evolution,
  variants,
  isLoggedIn,
}: {
  set: MakeupSet
  evolution: MakeupSet | null
  variants: MakeupVariant[]
  isLoggedIn: boolean
}) {
  const { mode } = useOutfitImageMode()

  const total = variants.length
  const obtained = variants.reduce((sum, variant) => sum + (variant.obtained ? 1 : 0), 0)

  const row = evolution ?? set
  const imageSrc = resolveOutfitImage(mode, { image: row.image_url, alt: row.alt_image_url }) || ''

  return (
    <SetCard
      in
      href="/makeup"
      imageSrc={imageSrc}
      isLoggedIn={false}
      obtained={obtained}
      rarity={row.rarity}
      showAlt={mode === 'alt'}
      title={row.title}
      topLeft={<ToggleIcon image="/icons/categories/full-makeup.png" size="xs" title="makeup" />}
      topRight={
        isLoggedIn ? <ProgressChip obtained={obtained} total={total} variant="parts" /> : undefined
      }
      total={total}
      onToggle={() => {}}
    />
  )
}
