import sharp from 'sharp'
import { MAX_IMAGE_BYTES, MAX_IMAGES } from '@/lib/types/feedback'

const MAX_DIMENSION = 2000

export interface ProcessedImage {
  buffer: Buffer
  name: string
}

// Re-encodes every upload server-side. This does three jobs at once:
// normalizes to WebP (matching the rest of the app's storage), strips EXIF —
// phone screenshots routinely carry GPS — and neutralizes a malicious payload
// disguised as an image, since the output is freshly encoded rather than the
// bytes we were handed.
//
// Anything that fails to decode is skipped rather than throwing: one bad file
// should not cost the user their whole report.
export async function processImages(files: File[]): Promise<ProcessedImage[]> {
  const accepted = files.filter((f) => f.size > 0 && f.size <= MAX_IMAGE_BYTES).slice(0, MAX_IMAGES)

  const results: ProcessedImage[] = []

  for (const [index, file] of accepted.entries()) {
    try {
      const input = Buffer.from(await file.arrayBuffer())
      const buffer = await sharp(input)
        .rotate() // apply EXIF orientation before the metadata is dropped
        .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer()

      results.push({ buffer, name: `${index}.webp` })
    } catch (error) {
      console.error(`Skipping unprocessable upload "${file.name}":`, error)
    }
  }

  return results
}
