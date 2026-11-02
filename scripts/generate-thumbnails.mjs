// One-off backfill for the `images` bucket:
//   1. writes the `X.thumb.webp` sibling lib/image-transform.ts points avatar-
//      sized images at (short side 200px, WebP q80) for every `X.webp` lacking one
//   2. downscales any original wider/taller than 1600px (the same cap
//      lib/image-to-webp.ts now applies on upload), in place
//
// Phases:
//   node --env-file=.env.local scripts/generate-thumbnails.mjs            # dry run (default)
//   node --env-file=.env.local scripts/generate-thumbnails.mjs execute
//
// Works from the images the DB references (orphans never render, so they need
// no thumbnail), sizing each with a HEAD request. The dry run downloads nothing:
// it lists what would be written and projects the bucket's new total (this
// project is on the 1 GB free tier). `execute` saves a
// local copy of every original it overwrites to bucket-backup/downsized/ BEFORE
// uploading the smaller one, and is resumable: thumbnails that already exist are
// skipped, and a downscaled original falls under the size threshold next time.
//
// Keep THUMB_SHORT_SIDE / MAX_DIMENSION in step with lib/image-transform.ts and
// lib/image-to-webp.ts.

import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const BUCKET = 'images'
const THUMB_SHORT_SIDE = 200
const THUMB_QUALITY = 80
const MAX_DIMENSION = 1600
const ORIGINAL_QUALITY = 90
// Only objects this big can plausibly exceed MAX_DIMENSION; checking dimensions
// means downloading, so don't fetch the ~12k small ones.
const DOWNSIZE_MIN_BYTES = 300 * 1024
// Measured: a 520×724 variant's thumbnail is ~4.7 KB. Used for the projection only.
const EST_THUMB_BYTES = 6 * 1024
const FREE_TIER_BYTES = 1024 ** 3
// Every (table, column) holding a public URL into the `images` bucket — the same
// list as scripts/migrate-images-to-webp.mjs.
const IMAGE_COLUMNS = [
  ['abilities', 'image_url'],
  ['custom_looks', 'image_url'],
  ['eureka_categories', 'image_url'],
  ['eureka_colors', 'image_url'],
  ['eureka_variants', 'image_url'],
  ['outfit_categories', 'image_url'],
  ['outfit_set_carousel_images', 'image_url'],
  ['season_categories', 'image_url'],
  ['trials', 'image_url'],
  ['outfit_sets', 'image_url'],
  ['outfit_sets', 'alt_image_url'],
  ['outfit_variants', 'image_url'],
  ['outfit_variants', 'alt_image_url'],
  ['seasons', 'image_url'],
  ['seasons', 'alt_image_url'],
  ['makeup_sets', 'image_url'],
  ['makeup_variants', 'image_url'],
  ['momo_cloaks', 'image_url'],
  ['momo_cloaks', 'alt_image_url'],
  ['locations', 'image_url'],
]
const BACKUP_DIR = path.resolve('bucket-backup/downsized')
const CONCURRENCY = 10

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  console.error('Run with: node --env-file=.env.local scripts/generate-thumbnails.mjs [execute]')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

const execute = process.argv[2] === 'execute'

const isThumb = (name) => name.endsWith('.thumb.webp')
const thumbPath = (name) => name.replace(/\.webp$/, '.thumb.webp')
const mb = (bytes) => `${(bytes / 1024 ** 2).toFixed(1)} MB`

const publicPrefix = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`

// Bucket-relative path of a referenced `.webp`, or null for anything else.
function urlToPath(url) {
  if (!url?.startsWith(publicPrefix)) return null
  const name = decodeURIComponent(url.slice(publicPrefix.length).split('?')[0])
  return name.endsWith('.webp') && !isThumb(name) ? name : null
}

async function referencedPaths() {
  const out = new Set()
  for (const [table, column] of IMAGE_COLUMNS) {
    for (let from = 0; ; from += 1000) {
      // `.order` keeps pagination stable; a column missing on a table is an error.
      const { data, error } = await supabase
        .from(table)
        .select(column)
        .order(column)
        .range(from, from + 999)
      if (error) throw new Error(`${table}.${column}: ${error.message}`)
      for (const row of data) {
        const name = urlToPath(row[column])
        if (name) out.add(name)
      }
      if (data.length < 1000) break
    }
  }
  return [...out]
}

// Size of a public object, or null when it doesn't exist. Retries transient
// network failures — ~24k HEADs in a row will hit the odd connect timeout.
async function headSize(name, attempt = 1) {
  try {
    const res = await fetch(publicPrefix + name.split('/').map(encodeURIComponent).join('/'), {
      method: 'HEAD',
    })
    return res.ok ? Number(res.headers.get('content-length') ?? 0) : null
  } catch (err) {
    if (attempt >= 4) throw err
    await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt))
    return headSize(name, attempt + 1)
  }
}

async function runPool(items, worker) {
  let index = 0
  let done = 0
  async function next() {
    while (index < items.length) {
      await worker(items[index++])
      if (++done % 250 === 0 || done === items.length) console.log(`  ${done}/${items.length}`)
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, next))
}

async function download(name) {
  const { data, error } = await supabase.storage.from(BUCKET).download(name)
  if (error) throw error
  return Buffer.from(await data.arrayBuffer())
}

async function upload(name, buffer, upsert) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(name, buffer, { contentType: 'image/webp', upsert })
  if (error) throw error
}

const objects = []
const needThumb = []
const paths = await referencedPaths()
console.log(`Checking ${paths.length} referenced images…`)
await runPool(paths, async (name) => {
  const [size, thumbSize] = await Promise.all([headSize(name), headSize(thumbPath(name))])
  if (size === null) return // dangling reference — nothing to thumbnail
  objects.push({ name, size })
  if (thumbSize === null) needThumb.push({ name, size })
})
const downsizeCandidates = objects.filter((o) => o.size >= DOWNSIZE_MIN_BYTES)

console.log(
  `Referenced originals found: ${objects.length} (${mb(objects.reduce((s, o) => s + o.size, 0))})`
)
console.log(
  `Thumbnails to write: ${needThumb.length} (≈ +${mb(needThumb.length * EST_THUMB_BYTES)})`
)
console.log(
  `Originals ≥ ${DOWNSIZE_MIN_BYTES / 1024} KB to check against ${MAX_DIMENSION}px: ${downsizeCandidates.length} (${mb(downsizeCandidates.reduce((s, o) => s + o.size, 0))})`
)
console.log(
  `Thumbnails add ≈ ${((needThumb.length * EST_THUMB_BYTES * 100) / FREE_TIER_BYTES).toFixed(1)}% of the 1 GB free tier — check current usage in the dashboard first`
)

if (!execute) {
  console.log('\nDry run — nothing written. Re-run with `execute` to apply.')
  process.exit(0)
}

const failures = []

console.log('\nDownscaling oversized originals…')
await mkdir(BACKUP_DIR, { recursive: true })
let saved = 0
await runPool(downsizeCandidates, async ({ name, size }) => {
  try {
    const original = await download(name)
    const { width, height } = await sharp(original).metadata()
    if (Math.max(width, height) <= MAX_DIMENSION) return
    // Backup first, so an interrupted run never leaves an original with no copy.
    const backup = path.join(BACKUP_DIR, name)
    await mkdir(path.dirname(backup), { recursive: true })
    await writeFile(backup, original)
    const smaller = await sharp(original)
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside' })
      .webp({ quality: ORIGINAL_QUALITY })
      .toBuffer()
    await upload(name, smaller, true)
    saved += size - smaller.length
  } catch (err) {
    failures.push([name, err.message])
  }
})
console.log(`  saved ${mb(saved)}`)

console.log('\nWriting thumbnails…')
await runPool(needThumb, async ({ name }) => {
  try {
    const thumb = await sharp(await download(name))
      .resize({
        width: THUMB_SHORT_SIDE,
        height: THUMB_SHORT_SIDE,
        fit: 'outside',
        withoutEnlargement: true,
      })
      .webp({ quality: THUMB_QUALITY })
      .toBuffer()
    await upload(thumbPath(name), thumb, false)
  } catch (err) {
    failures.push([thumbPath(name), err.message])
  }
})

if (failures.length) {
  console.log(`\n${failures.length} failures:`)
  for (const [name, message] of failures) console.log(`  ${name}: ${message}`)
  process.exitCode = 1
} else {
  console.log('\nDone.')
}
