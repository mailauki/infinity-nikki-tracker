// Storage object paths are `{table}/{slug}/{column}.webp` — see
// components/forms/image-upload.tsx, which builds the same shape on upload.
// The slug is the storage key, so renaming a variant's slug strands its files
// unless they are copied to the new folder first.

const BUCKET_SEGMENT = '/images/'

export type ImageColumn = 'image_url' | 'alt_image_url'

/**
 * Turn a stored public URL into its bucket object path.
 *
 * Every stored URL carries a `?v=` cache-buster (image-upload.tsx appends one
 * so a replaced image is not served stale), and a handful of relinked rows
 * carry none — both must work. The query string is not part of the object
 * path, so it is dropped.
 */
export function objectPathFromUrl(url: string): string | null {
  let pathname: string
  try {
    pathname = decodeURIComponent(new URL(url).pathname)
  } catch {
    return null
  }
  const index = pathname.indexOf(BUCKET_SEGMENT)
  if (index === -1) return null
  return pathname.slice(index + BUCKET_SEGMENT.length)
}

export function variantFolder(table: string, slug: string): string {
  return `${table}/${slug}`
}

export function objectPathFor(table: string, slug: string, column: ImageColumn): string {
  return `${variantFolder(table, slug)}/${column}.webp`
}

/**
 * Build the public URL for an object path, with a fresh cache-buster so the
 * CDN cannot serve a stale object under the new path.
 */
export function publicUrlFor(baseUrl: string, objectPath: string): string {
  return `${baseUrl}/storage/v1/object/public/images/${objectPath}?v=${Date.now()}`
}
