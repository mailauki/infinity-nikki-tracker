// Re-encode a browser-selected image File to WebP before upload, so every
// object stored in the `images` bucket has a consistent `.webp` extension and
// content type. Uses a canvas so no extra dependency is pulled into the client
// bundle. Quality 0.9 matches the migration script's `sharp` setting.

import { THUMB_SHORT_SIDE } from './image-transform'

const WEBP_QUALITY = 0.9
// Thumbnails are only ever painted at ≤188 device px, where 0.8 is visually
// indistinguishable and roughly halves the bytes.
const THUMB_QUALITY = 0.8

// No surface in the app paints wider than this; bigger uploads (carousel and
// trial art came in at 1–1.3 MB each) are downscaled to it.
const MAX_DIMENSION = 1600

// Reads a File into an HTMLImageElement via an object URL, revoking the URL
// once the browser has decoded it.
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not decode the selected image.'))
    }
    img.src = url
  })
}

// Draws `img` scaled by `scale` (never up) and encodes it as a WebP File.
async function encodeWebp(
  img: HTMLImageElement,
  scale: number,
  quality: number,
  name: string
): Promise<File> {
  const s = Math.min(1, scale)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.naturalWidth * s)
  canvas.height = Math.round(img.naturalHeight * s)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable.')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', quality)
  )
  if (!blob) throw new Error('WebP encoding failed.')

  return new File([blob], name, { type: 'image/webp' })
}

// Converts an image File to a WebP File named `${baseName}.webp`, downscaled so
// neither side exceeds MAX_DIMENSION. A WebP source already within bounds is
// returned unchanged (only the name is normalized). Throws if the browser cannot
// decode or encode the image, so callers surface a real upload error rather than
// storing a broken object.
export async function fileToWebp(file: File, baseName = 'image'): Promise<File> {
  const img = await loadImage(file)
  const scale = MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight)

  if (file.type === 'image/webp' && scale >= 1) {
    return new File([file], `${baseName}.webp`, { type: 'image/webp' })
  }
  return encodeWebp(img, scale, WEBP_QUALITY, `${baseName}.webp`)
}

// The `${baseName}.thumb.webp` sibling lib/image-transform.ts points small
// avatars at: short side THUMB_SHORT_SIDE px. Must match
// scripts/generate-thumbnails.mjs, which backfills the same files.
export async function webpThumbnail(file: File, baseName = 'image'): Promise<File> {
  const img = await loadImage(file)
  const scale = THUMB_SHORT_SIDE / Math.min(img.naturalWidth, img.naturalHeight)
  return encodeWebp(img, scale, THUMB_QUALITY, `${baseName}.thumb.webp`)
}
