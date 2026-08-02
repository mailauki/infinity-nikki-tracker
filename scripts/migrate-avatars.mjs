// One-off migration for the `avatars` bucket, mirroring what
// migrate-images-to-webp.mjs did for `images`:
//
//   1. Every referenced avatar is re-encoded to WebP and moved to the stable
//      path `{user_id}/avatar.webp` (one object per user, forever).
//   2. profiles.avatar_url is rewritten from a bare storage path
//      ("{uid}/0.3150954270579016.jpg") to a full public URL with a ?v= bust,
//      so <LazyImage src={avatar_url}> can render it directly.
//   3. Every other object in the bucket is an orphan (an old random-named
//      upload no profile points at) and is deleted.
//
// Phases (nothing destructive runs by default):
//   node --env-file=.env.local scripts/migrate-avatars.mjs backup
//   node --env-file=.env.local scripts/migrate-avatars.mjs inventory
//   node --env-file=.env.local scripts/migrate-avatars.mjs dry-run
//   node --env-file=.env.local scripts/migrate-avatars.mjs execute
//
// `execute` is idempotent: a profile already pointing at a public avatar.webp
// URL is skipped, so a re-run after an interruption continues cleanly. It
// requires a completed `backup` on disk before it will touch anything.

import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { mkdir, writeFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const BUCKET = 'avatars'
const QUALITY = 90
const BACKUP_DIR = path.resolve('avatar-backup')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  console.error('Run with: node --env-file=.env.local scripts/migrate-avatars.mjs <phase>')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

const publicPrefix = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`

function isPlaceholder(name) {
  return name.endsWith('.emptyFolderPlaceholder')
}

function targetPathFor(userId) {
  return `${userId}/avatar.webp`
}

function publicUrlFor(objectPath) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath)
  return `${data.publicUrl}?v=${Date.now()}`
}

// avatar_url historically stored a bare bucket-relative path. It may already be
// a full public URL if this script has partially run. Normalize either form to
// the object path, or null if it points somewhere unexpected.
function toObjectPath(avatarUrl) {
  if (!avatarUrl) return null
  if (avatarUrl.startsWith(publicPrefix)) {
    return decodeURIComponent(avatarUrl.slice(publicPrefix.length).split('?')[0])
  }
  if (avatarUrl.startsWith('http')) return null // some other host — leave alone
  return decodeURIComponent(avatarUrl.split('?')[0])
}

// Every object currently in the bucket.
async function listAll() {
  const out = []
  const { data: folders, error } = await supabase.storage.from(BUCKET).list('', { limit: 1000 })
  if (error) throw error
  for (const folder of folders ?? []) {
    // Objects live one level deep: {user_id}/{file}. A row with no id is a folder.
    if (folder.id === null) {
      const { data: files, error: fErr } = await supabase.storage
        .from(BUCKET)
        .list(folder.name, { limit: 1000 })
      if (fErr) throw fErr
      for (const f of files ?? []) {
        if (!isPlaceholder(f.name)) {
          out.push({ name: `${folder.name}/${f.name}`, size: f.metadata?.size ?? 0 })
        }
      }
    } else if (!isPlaceholder(folder.name)) {
      out.push({ name: folder.name, size: folder.metadata?.size ?? 0 })
    }
  }
  return out
}

// Profiles that reference an avatar, resolved to the object each one points at.
async function listReferencingProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .not('avatar_url', 'is', null)
  if (error) throw error
  return (data ?? []).map((row) => ({
    ...row,
    objectPath: toObjectPath(row.avatar_url),
    targetPath: targetPathFor(row.id),
    alreadyMigrated:
      row.avatar_url.startsWith(publicPrefix) &&
      toObjectPath(row.avatar_url) === targetPathFor(row.id),
  }))
}

// -------- phases --------

async function phaseBackup() {
  const objects = await listAll()
  console.log(`Backing up ${objects.length} objects to ${BACKUP_DIR} ...`)
  await mkdir(BACKUP_DIR, { recursive: true })
  for (const obj of objects) {
    const dest = path.join(BACKUP_DIR, obj.name)
    if (existsSync(dest)) {
      continue // resumable
    }
    const { data, error } = await supabase.storage.from(BUCKET).download(obj.name)
    if (error) throw new Error(`Download ${obj.name}: ${error.message}`)
    await mkdir(path.dirname(dest), { recursive: true })
    await writeFile(dest, Buffer.from(await data.arrayBuffer()))
  }
  const onDisk = await countFiles(BACKUP_DIR)
  console.log(`Backup complete: ${onDisk} files on disk (expected ${objects.length}).`)
  if (onDisk < objects.length) {
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
  const profiles = await listReferencingProfiles()

  const referenced = new Set(profiles.map((p) => p.objectPath).filter(Boolean))
  const orphans = objects.filter((o) => !referenced.has(o.name))
  const dangling = profiles.filter(
    (p) => p.objectPath && !objects.some((o) => o.name === p.objectPath)
  )

  console.log('=== INVENTORY ===')
  console.log(`Objects in bucket:        ${objects.length}`)
  console.log(`Profiles with an avatar:  ${profiles.length}`)
  console.log(`Already migrated:         ${profiles.filter((p) => p.alreadyMigrated).length}`)
  console.log(`Referenced objects:       ${referenced.size}`)
  console.log(`Orphans (to delete):      ${orphans.length}`)
  console.log(`Dangling (DB, no object): ${dangling.length}`)

  if (orphans.length) {
    console.log('\nOrphan objects (no profile points at these — will be DELETED):')
    orphans.forEach((o) => console.log(`  ${o.name}`))
  }
  if (dangling.length) {
    console.log('\nDangling profile references (object missing — avatar_url will be cleared):')
    dangling.forEach((p) => console.log(`  ${p.id} (@${p.username}) -> ${p.objectPath}`))
  }
  return { objects, profiles, orphans, dangling }
}

async function phaseDryRun() {
  const { profiles, orphans, dangling } = await phaseInventory()
  console.log('\n=== DRY RUN (no writes) ===')
  const todo = profiles.filter((p) => !p.alreadyMigrated && p.objectPath)
  console.log(`Would migrate ${todo.length} avatars:\n`)
  for (const p of todo) {
    const missing = dangling.some((d) => d.id === p.id)
    console.log(`  @${p.username ?? p.id}`)
    console.log(
      `    object   ${p.objectPath}${missing ? '   [MISSING — will clear avatar_url]' : ''}`
    )
    if (!missing) {
      console.log(`    ->       ${p.targetPath}`)
      console.log(`    avatar_url -> ${publicPrefix}${p.targetPath}?v=<ts>`)
    }
  }
  console.log(`\nWould delete ${orphans.length} orphan objects.`)
  console.log('\nRe-run with `execute` to apply (requires a completed backup).')
}

async function phaseExecute() {
  if (!existsSync(BACKUP_DIR)) {
    console.error('No backup found. Run the `backup` phase first.')
    process.exit(1)
  }
  const { profiles, orphans, dangling } = await phaseInventory()
  const todo = profiles.filter((p) => !p.alreadyMigrated && p.objectPath)
  console.log(`\n=== EXECUTE: migrating ${todo.length} avatars ===`)

  let migrated = 0
  let cleared = 0
  let failed = 0
  const migratedSources = []

  for (const p of todo) {
    try {
      // A profile pointing at an object that no longer exists can't be
      // migrated — clear the stale reference rather than leaving a broken URL.
      if (dangling.some((d) => d.id === p.id)) {
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: null })
          .eq('id', p.id)
        if (error) throw new Error(`clear avatar_url: ${error.message}`)
        cleared++
        console.log(`  CLEARED @${p.username ?? p.id} (source object missing)`)
        continue
      }

      const { data: dl, error: dlErr } = await supabase.storage.from(BUCKET).download(p.objectPath)
      if (dlErr) throw new Error(`download: ${dlErr.message}`)
      const input = Buffer.from(await dl.arrayBuffer())

      const webp = await sharp(input).webp({ quality: QUALITY }).toBuffer()

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(p.targetPath, webp, { upsert: true, contentType: 'image/webp' })
      if (upErr) throw new Error(`upload: ${upErr.message}`)

      const { error: dbErr } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrlFor(p.targetPath) })
        .eq('id', p.id)
      if (dbErr) throw new Error(`db: ${dbErr.message}`)

      migrated++
      // The old random-named source is an orphan now that the profile points
      // at avatar.webp. It wasn't in `orphans` (still referenced when this run
      // started), so collect it here — otherwise it survives until a second run.
      migratedSources.push(p.objectPath)
      console.log(`  OK @${p.username ?? p.id}: ${p.objectPath} -> ${p.targetPath}`)
    } catch (err) {
      failed++
      console.error(`  FAIL ${p.id}: ${err.message}`)
    }
  }

  // Delete orphans last, and never a stable `avatar.webp` target. Skipped
  // entirely if anything failed, so a retry still has its source files to read.
  const targets = new Set(profiles.map((p) => p.targetPath))
  const deletable = [...orphans.map((o) => o.name), ...migratedSources].filter(
    (name) => !targets.has(name)
  )

  if (failed > 0) {
    console.log(`\nSkipping orphan deletion: ${failed} migration(s) failed. Re-run execute first.`)
  } else if (deletable.length) {
    const { error } = await supabase.storage.from(BUCKET).remove(deletable)
    if (error) console.error(`Orphan deletion failed: ${error.message}`)
    else console.log(`\nDeleted ${deletable.length} orphan objects.`)
  }

  console.log(`\nDone. Migrated ${migrated}, cleared ${cleared}, failed ${failed}.`)
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
    'Usage: node --env-file=.env.local scripts/migrate-avatars.mjs <backup|inventory|dry-run|execute>'
  )
  process.exit(1)
}
phases[phase]().catch((err) => {
  console.error(err)
  process.exit(1)
})
