'use client'

import LazyImage from '@/components/lazy-image'
import {
  resolveOutfitImage,
  useOutfitImageMode,
} from '@/components/outfits/outfit-image-mode-context'

// The season's hero image. A client component purely so the banner follows the
// toolbar's image swap like the cards below it — the page itself is a Server
// Component and cannot read the image-mode context. `resolveOutfitImage` falls
// back to the main image for the seasons that have no alternate.
export default function SeasonBanner({
  image,
  altImage,
  title,
}: {
  image: string | null
  altImage: string | null
  title: string
}) {
  const { mode } = useOutfitImageMode()
  const src = resolveOutfitImage(mode, { image, alt: altImage })

  return <LazyImage image={src ?? undefined} kind="media" sx={{ height: 360 }} title={title} />
}
