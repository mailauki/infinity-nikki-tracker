// Re-encode a browser-selected image File to WebP before upload, so every
// object stored in the `images` bucket has a consistent `.webp` extension and
// content type. Uses a canvas so no extra dependency is pulled into the client
// bundle. Quality 0.9 matches the migration script's `sharp` setting.

const WEBP_QUALITY = 0.9

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

// Converts an image File to a WebP File named `${baseName}.webp`. If the source
// is already WebP it is returned unchanged (only the name is normalized). Throws
// if the browser cannot decode or encode the image, so callers surface a real
// upload error rather than storing a broken object.
export async function fileToWebp(file: File, baseName = 'image'): Promise<File> {
  if (file.type === 'image/webp') {
    return new File([file], `${baseName}.webp`, { type: 'image/webp' })
  }

  const img = await loadImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable.')
  ctx.drawImage(img, 0, 0)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY)
  )
  if (!blob) throw new Error('WebP encoding failed.')

  return new File([blob], `${baseName}.webp`, { type: 'image/webp' })
}
