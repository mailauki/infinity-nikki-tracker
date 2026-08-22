// Renders lib/og-image-template.tsx to the committed static PNG at
// public/opengraph-image.png, and writes the 630x630 center crop that social
// platforms produce so the safe zone can be checked by eye.
//
//   node scripts/generate-og-image.mjs           # write the PNG(s)
//   node scripts/generate-og-image.mjs --check   # fail if the committed PNG is stale
//
// The JSX file stays the source of truth: it imports the live theme tokens, so
// regenerating after a palette change is how the static copy keeps up. --check
// exists so CI (or a reviewer) can catch a generator edit that never had the
// PNG regenerated — the drift this pair would otherwise invite.

import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import path from 'node:path'
import ts from 'typescript'
import sharp from 'sharp'

const require = createRequire(import.meta.url)
const Module = require('module')
const ROOT = process.cwd()
const OUT = path.join(ROOT, 'public/opengraph-image.png')
const CROP_OUT = path.join(ROOT, 'public/opengraph-image-square.png')
const CHECK = process.argv.includes('--check')

// The route module is TSX with a '@/' path alias and Next-only imports. Rather
// than boot Next just to rasterize one image, transpile it in-process and stub
// the two imports that only matter to the framework (`next/cache`'s cacheLife
// is a no-op outside a request).
function transpile(file, jsx) {
  return ts.transpileModule(readFileSync(file), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: jsx ? ts.JsxEmit.ReactJSX : undefined,
    },
    fileName: file,
  }).outputText
}

function readFileSync(f) {
  return require('node:fs').readFileSync(f, 'utf8')
}

function loadRouteModule() {
  const origResolve = Module._resolveFilename
  const origCompile = Module.prototype._compile

  // Resolve the '@/' alias the same way tsconfig does — mapped to the repo
  // root — rather than listing individual modules. The route imports more than
  // one aliased file, and a hardcoded list silently breaks the moment another
  // is added.
  Module._resolveFilename = function (request, ...rest) {
    if (request === 'next/cache') return '\0next-cache-stub'
    if (request === './types/eureka') return '\0empty-stub'
    if (request.startsWith('@/')) {
      const base = path.join(ROOT, request.slice(2))
      for (const ext of ['.ts', '.tsx', '/index.ts', '']) {
        if (existsSync(base + ext)) return base + ext
      }
    }
    return origResolve.call(this, request, ...rest)
  }

  const origLoad = Module._load
  Module._load = function (request, ...rest) {
    if (request === 'next/cache') return { cacheLife: () => {} }
    if (request === './types/eureka') return {}
    return origLoad.call(this, request, ...rest)
  }

  // Compile .ts/.tsx on require so the alias target and the route both load.
  Module.prototype._compile = function (content, filename) {
    if (filename.endsWith('.tsx') || filename.endsWith('.ts')) {
      content = transpile(filename, filename.endsWith('.tsx'))
    }
    return origCompile.call(this, content, filename)
  }

  const routePath = path.join(ROOT, 'lib/og-image-template.tsx')
  const mod = new Module(routePath, null)
  mod.paths = Module._nodeModulePaths(path.dirname(routePath))
  mod._compile(transpile(routePath, true), routePath)

  Module._resolveFilename = origResolve
  Module._load = origLoad
  Module.prototype._compile = origCompile
  return mod.exports
}

const template = loadRouteModule()
const png = Buffer.from(await template.renderOgPng())

const meta = await sharp(png).metadata()
if (meta.width !== 1200 || meta.height !== 630) {
  console.error(`Expected 1200x630, got ${meta.width}x${meta.height}`)
  process.exit(1)
}

// The crop every square-thumbnail platform performs: keep the middle `height`
// px of a `width`-wide image. Written out so the safe zone is reviewable as an
// artifact rather than a claim in a comment.
const square = await sharp(png)
  .extract({
    left: Math.round((meta.width - meta.height) / 2),
    top: 0,
    width: meta.height,
    height: meta.height,
  })
  .png()
  .toBuffer()

if (CHECK) {
  if (!existsSync(OUT)) {
    console.error('public/opengraph-image.png is missing — run: node scripts/generate-og-image.mjs')
    process.exit(1)
  }
  const committed = await readFile(OUT)
  const a = createHash('sha256').update(committed).digest('hex')
  const b = createHash('sha256').update(png).digest('hex')
  if (a !== b) {
    console.error(
      'public/opengraph-image.png is stale — lib/og-image-template.tsx has changed since it was generated.\n' +
        'Regenerate with: node scripts/generate-og-image.mjs'
    )
    process.exit(1)
  }
  console.log('public/opengraph-image.png is up to date')
  process.exit(0)
}

await writeFile(OUT, png)
await writeFile(CROP_OUT, square)
console.log(`wrote ${path.relative(ROOT, OUT)} (${meta.width}x${meta.height}, ${png.length} bytes)`)
console.log(`wrote ${path.relative(ROOT, CROP_OUT)} (${meta.height}x${meta.height}, center crop)`)
