// Thumbnail URLs for the avatar-sized images (up to the 94px variant cards).
//
// `images.unoptimized: true` (next.config.ts) means every <img> gets the raw
// source file, and Supabase Storage image transformations are not enabled on
// this project (the /render/image endpoint returns 403). So a 94px card used to
// download the full ~520×724 original — ~63 KB on average, 236 KB at worst.
//
// Instead, every `X.webp` in the `images` bucket has a pre-generated sibling
// `X.thumb.webp` (short side THUMB_SHORT_SIDE px): written next to the original
// by the admin upload field (components/forms/image-upload.tsx) and backfilled
// for existing objects by scripts/generate-thumbnails.mjs. This module only
// rewrites the URL; `useLazyImage` is given the original as a fallback, so an
// object without a thumbnail still shows — it just costs one failed request.

// Short side of a generated thumbnail. Covers the 94px `lg` Avatar at 2x
// (188px) with a little headroom; `object-fit: cover` crops the long side.
export const THUMB_SHORT_SIDE = 200

const IMAGES_BUCKET_PATH = '/storage/v1/object/public/images/'

/** Storage object path of the thumbnail for an object path (`a/b.webp` → `a/b.thumb.webp`). */
export function thumbPath(objectPath: string): string {
  return objectPath.replace(/\.webp$/, '.thumb.webp')
}

/**
 * The thumbnail URL for `src`, or `src` unchanged when it isn't a public
 * `.webp` object in the `images` bucket (local /icons, blob:, data:, signed
 * URLs, profile avatars in the `avatars` bucket, legacy non-WebP files).
 * A `?v=` cache-buster is carried over: the thumbnail is uploaded alongside the
 * original, so it changes exactly when the original does.
 */
export function thumbnailSrc(src: string): string {
  if (!src.includes(IMAGES_BUCKET_PATH)) return src
  const [path, query] = src.split('?', 2)
  if (!path.endsWith('.webp') || path.endsWith('.thumb.webp')) return src
  // Anything other than our own cache-buster (a signed token, say) means the URL
  // was parameterized for a reason — don't second-guess it.
  if (query !== undefined && !/^v=\d+$/.test(query)) return src
  return thumbPath(path) + (query !== undefined ? `?${query}` : '')
}
