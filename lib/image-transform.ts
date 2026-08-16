// Thumbnail URLs for the small avatars.
//
// `images.unoptimized: true` (next.config.ts) means every <img> gets the raw
// source file, so a 40px avatar in the nav bar or an Autocomplete row downloads
// the same full-resolution art the 94px cards use — and profile avatars aren't
// resized on upload at all, so that one is whatever the user picked.
//
// Supabase Storage can resize on its edge: the same object served from
// /storage/v1/render/image/public/ instead of /storage/v1/object/public/ takes
// width/height/resize/quality params and negotiates WebP from the Accept header.
// This module rewrites eligible URLs to that endpoint.
//
// It is deliberately conservative — anything it doesn't positively recognize is
// returned untouched — because image transformations are a paid Storage feature
// and may not be enabled. `useLazyImage` is given the original URL as a
// fallback, and the first time a transform fails where the original succeeds,
// `reportTransformFailure()` switches this module off for the rest of the
// session so nothing else pays for a doomed request.

// Rendered CSS pixels are doubled so the thumbnail still holds up on a 2x
// display. Matches the `sizes` hint the optimized avatar path already uses.
const DPR = 2

// Supabase's default is 80. 75 is visually indistinguishable at 48–80px.
const QUALITY = 75

const PUBLIC_OBJECT_PATH = '/storage/v1/object/public/'
const PUBLIC_RENDER_PATH = '/storage/v1/render/image/public/'

let transformsAvailable = true

/**
 * Called when a transformed URL failed but the original loaded — the signature
 * of transformations being unavailable on the project rather than of a missing
 * object. Stops this module rewriting anything for the rest of the session.
 */
export function reportTransformFailure() {
  transformsAvailable = false
}

/** Test seam — module state is session-scoped by design. */
export function resetTransformAvailability() {
  transformsAvailable = true
}

/**
 * A resized variant of `src` sized for a `px` CSS-pixel box, or `src` unchanged
 * when it isn't a plain public Storage object (local /icons, blob:, data:,
 * signed URLs, anything already carrying query params) or transforms are off.
 */
export function thumbnailSrc(src: string, px: number): string {
  if (!transformsAvailable) return src
  // A query string means the caller already parameterized this URL (a signed
  // token, an existing transform, a cache-buster). Don't second-guess it.
  if (src.includes('?')) return src
  const index = src.indexOf(PUBLIC_OBJECT_PATH)
  if (index === -1) return src

  const size = Math.round(px * DPR)
  const rewritten = src.replace(PUBLIC_OBJECT_PATH, PUBLIC_RENDER_PATH)
  // resize=cover with a square box matches the `object-fit: cover` the avatar
  // renders with, so nothing is downloaded that won't be painted.
  return `${rewritten}?width=${size}&height=${size}&resize=cover&quality=${QUALITY}`
}
