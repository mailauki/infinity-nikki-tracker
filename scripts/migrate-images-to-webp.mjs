// One-off migration: re-encode every non-WebP object in the `images` bucket to
// WebP (quality 90) and rewrite the referencing DB columns to the new `.webp`
// public URL. Excludes the `icons/` folder (flat graphics stay PNG) and Supabase
// `.emptyFolderPlaceholder` markers.
//
// Phases (each explicit, nothing destructive runs by default):
//   node --env-file=.env.local scripts/migrate-images-to-webp.mjs backup
//   node --env-file=.env.local scripts/migrate-images-to-webp.mjs inventory
//   node --env-file=.env.local scripts/migrate-images-to-webp.mjs dry-run
//   node --env-file=.env.local scripts/migrate-images-to-webp.mjs execute
//
// `execute` is idempotent/resumable: an object already stored as `.webp` and
// referenced by the DB is skipped, so a re-run after an interruption continues
// cleanly. It requires a completed `backup` (verified on disk) before it will run.

import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { mkdir, writeFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const BUCKET = 'images'
const QUALITY = 90
// Flat-graphic icon folders kept as PNG — lossy WebP can soften hard edges.
const EXCLUDE_FOLDERS = new Set(['icons', 'categories', 'colors'])
const BACKUP_DIR = path.resolve('bucket-backup')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  console.error('Run with: node --env-file=.env.local scripts/migrate-images-to-webp.mjs <phase>')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

// Serial per-object I/O made backup/execute take ~1.5 items/sec (hours for
// 7k objects). Run `worker` over `items` with a bounded pool so downloads and
// re-encodes overlap. onProgress is called after each item settles.
const CONCURRENCY = 10
async function runPool(items, worker, onProgress) {
  let index = 0
  let done = 0
  async function next() {
    while (index < items.length) {
      const i = index++
      await worker(items[i], i)
      done++
      if (onProgress) onProgress(done, items.length)
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, next))
}

// Every (table, column) pair whose values are public URLs into the `images`
// bucket. profiles.avatar_url is intentionally omitted — it lives in the
// separate `avatars` bucket and is out of scope.
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
]

const publicPrefix = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`

// Strip the public URL + any ?v= cache-bust down to the bucket-relative object
// path, or return null if the URL doesn't point at this bucket.
function urlToPath(url) {
  if (!url || !url.startsWith(publicPrefix)) return null
  const rest = url.slice(publicPrefix.length).split('?')[0]
  return decodeURIComponent(rest)
}

function isPlaceholder(name) {
  return name.endsWith('.emptyFolderPlaceholder')
}
function isExcluded(name) {
  return EXCLUDE_FOLDERS.has(name.split('/')[0])
}
function isWebp(name) {
  return name.toLowerCase().endsWith('.webp')
}
function toWebpPath(name) {
  return name.replace(/\.[^/.]+$/, '') + '.webp'
}

// List every object in the bucket via the `list_image_objects` RPC (a
// service-role-only SECURITY DEFINER function over storage.objects). This
// replaces walking the Storage list API prefix-by-prefix, which recursed once
// per slug folder (~2,000 serial round-trips, 20+ minutes) because folders like
// outfit_variants/ contain 1,000+ subfolders. The RPC returns every name in a
// handful of paginated queries instead. PostgREST caps each response at 1,000
// rows, so page with .range().
async function listAll() {
  const out = []
  const pageSize = 1000
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .rpc('list_image_objects')
      .range(from, from + pageSize - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    for (const row of data) out.push({ name: row.name, size: row.size ?? 0 })
    if (data.length < pageSize) break
  }
  return out
}

// Build a map of objectPath -> [{ table, column, id, currentUrl }] from the DB,
// so we know which rows to rewrite for each stored object.
//
// Each table is read with .range() pagination: a bare .select() is capped at
// 1,000 rows by PostgREST, and outfit_variants alone has ~5,390 — without
// paging, ~4,000 rows silently drop out of the map, look like orphans, and
// (worse) never get their image_url rewritten during execute.
async function buildDbReferenceMap() {
  const map = new Map()
  const pageSize = 1000
  for (const [table, column] of IMAGE_COLUMNS) {
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase
        .from(table)
        .select(`id, ${column}`)
        .range(from, from + pageSize - 1)
      if (error) throw new Error(`Reading ${table}.${column}: ${error.message}`)
      if (!data || data.length === 0) break
      for (const row of data) {
        const objectPath = urlToPath(row[column])
        if (!objectPath) continue
        if (!map.has(objectPath)) map.set(objectPath, [])
        map.get(objectPath).push({ table, column, id: row.id, currentUrl: row[column] })
      }
      if (data.length < pageSize) break
    }
  }
  return map
}

function publicUrlFor(objectPath) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath)
  return `${data.publicUrl}?v=${Date.now()}`
}

// -------- phases --------

async function phaseBackup() {
  const objects = await listAll()
  const real = objects.filter((o) => !isPlaceholder(o.name))
  console.log(`Backing up ${real.length} objects to ${BACKUP_DIR} ...`)
  await mkdir(BACKUP_DIR, { recursive: true })
  await runPool(
    real,
    async (obj) => {
      const dest = path.join(BACKUP_DIR, obj.name)
      if (existsSync(dest)) return // resumable: already backed up
      const { data, error } = await supabase.storage.from(BUCKET).download(obj.name)
      if (error) throw new Error(`Download ${obj.name}: ${error.message}`)
      await mkdir(path.dirname(dest), { recursive: true })
      await writeFile(dest, Buffer.from(await data.arrayBuffer()))
    },
    (done, total) => {
      if (done % 200 === 0) console.log(`  ${done}/${total}`)
    }
  )
  // Verify: count files on disk matches object count.
  const onDisk = await countFiles(BACKUP_DIR)
  console.log(`Backup complete: ${onDisk} files on disk (expected ${real.length}).`)
  if (onDisk < real.length) {
    console.error('WARNING: fewer files on disk than expected — do NOT run execute yet.')
    process.exit(1)
  }
}

async function countFiles(dir) {
  let n = 0
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    n += entry.isDirectory() ? await countFiles(p) : 1
  }
  return n
}

async function phaseInventory() {
  const objects = await listAll()
  const dbMap = await buildDbReferenceMap()

  const real = objects.filter((o) => !isPlaceholder(o.name) && !isExcluded(o.name))
  const toConvert = real.filter((o) => !isWebp(o.name))
  const orphans = real.filter((o) => !dbMap.has(o.name)) // in bucket, no DB row
  const objectNames = new Set(objects.map((o) => o.name))
  const dangling = [] // DB URL with no bucket object
  for (const [objectPath, refs] of dbMap) {
    if (!objectNames.has(objectPath)) dangling.push({ objectPath, refs })
  }

  console.log('=== INVENTORY ===')
  console.log(`Total objects:            ${objects.length}`)
  console.log(`Real images (excl icons): ${real.length}`)
  console.log(`Already .webp:            ${real.length - toConvert.length}`)
  console.log(`To convert:               ${toConvert.length}`)
  console.log(`Orphans (no DB ref):      ${orphans.length}`)
  console.log(`Dangling (DB, no object): ${dangling.length}`)
  if (orphans.length) {
    console.log('\nOrphan objects (will be converted in place but touch no DB row):')
    orphans.slice(0, 50).forEach((o) => console.log(`  ${o.name}`))
    if (orphans.length > 50) console.log(`  ... +${orphans.length - 50} more`)
  }
  if (dangling.length) {
    console.log('\nDangling DB references (object missing — NOT touched, review manually):')
    dangling
      .slice(0, 50)
      .forEach((d) =>
        console.log(
          `  ${d.objectPath}  <- ${d.refs.map((r) => `${r.table}.${r.column}#${r.id}`).join(', ')}`
        )
      )
  }
  return { objects, dbMap, toConvert, orphans, dangling }
}

async function phaseDryRun() {
  const { toConvert, dbMap } = await phaseInventory()
  console.log('\n=== DRY RUN (no writes) ===')
  let withRef = 0
  let noRef = 0
  for (const obj of toConvert) {
    const refs = dbMap.get(obj.name)
    if (refs) withRef++
    else noRef++
  }
  console.log(`Would convert ${toConvert.length} objects to .webp:`)
  console.log(`  ${withRef} have DB references that will be rewritten`)
  console.log(`  ${noRef} are orphans (converted, no DB change)`)
  console.log('\nSample of planned changes:')
  toConvert.slice(0, 15).forEach((o) => {
    const refs = dbMap.get(o.name)
    console.log(`  ${o.name}`)
    console.log(`    -> ${toWebpPath(o.name)}`)
    if (refs) refs.forEach((r) => console.log(`       update ${r.table}.${r.column} #${r.id}`))
  })
  console.log('\nRe-run with `execute` to apply (requires a completed backup).')
}

async function phaseExecute() {
  if (!existsSync(BACKUP_DIR)) {
    console.error('No backup found. Run the `backup` phase first.')
    process.exit(1)
  }
  const { toConvert, dbMap } = await phaseInventory()
  console.log(`\n=== EXECUTE: converting ${toConvert.length} objects ===`)

  let converted = 0
  let failed = 0
  await runPool(
    toConvert,
    async (obj) => {
      const oldPath = obj.name
      const newPath = toWebpPath(oldPath)
      try {
        // 1. download original
        const { data: dl, error: dlErr } = await supabase.storage.from(BUCKET).download(oldPath)
        if (dlErr) throw new Error(`download: ${dlErr.message}`)
        const input = Buffer.from(await dl.arrayBuffer())

        // 2. re-encode to webp q90
        const webp = await sharp(input).webp({ quality: QUALITY }).toBuffer()

        // 3. upload to .webp path
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(newPath, webp, { upsert: true, contentType: 'image/webp' })
        if (upErr) throw new Error(`upload: ${upErr.message}`)

        // 4. rewrite referencing DB columns
        const refs = dbMap.get(oldPath) ?? []
        const newUrl = publicUrlFor(newPath)
        for (const r of refs) {
          const { error: dbErr } = await supabase
            .from(r.table)
            .update({ [r.column]: newUrl })
            .eq('id', r.id)
          if (dbErr) throw new Error(`db ${r.table}.${r.column}#${r.id}: ${dbErr.message}`)
        }

        // 5. delete old object (only if the path actually changed)
        if (newPath !== oldPath) {
          const { error: rmErr } = await supabase.storage.from(BUCKET).remove([oldPath])
          if (rmErr) throw new Error(`remove: ${rmErr.message}`)
        }

        converted++
      } catch (err) {
        failed++
        console.error(`  FAIL ${oldPath}: ${err.message}`)
      }
    },
    (done, total) => {
      if (done % 100 === 0) console.log(`  ${done}/${total} (ok ${converted}, fail ${failed})`)
    }
  )
  console.log(`\nDone. Converted ${converted}, failed ${failed}.`)
  if (failed) console.log('Re-run `execute` to retry failures (idempotent).')
}

const phase = process.argv[2]
const phases = {
  backup: phaseBackup,
  inventory: phaseInventory,
  'dry-run': phaseDryRun,
  execute: phaseExecute,
}
if (!phases[phase]) {
  console.error(
    'Usage: node --env-file=.env.local scripts/migrate-images-to-webp.mjs <backup|inventory|dry-run|execute>'
  )
  process.exit(1)
}
phases[phase]().catch((err) => {
  console.error(err)
  process.exit(1)
})
