import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { COLOR_THEME_PRESETS } from '@/lib/theme-presets'
import { OG_SIZE } from '@/lib/og-image'

// The OpenGraph card's layout, rasterized to public/opengraph-image.png by
// scripts/generate-og-image.mjs. This is a build-time template, not a route:
// the static PNG is what crawlers are served, so the image never depends on a
// function invocation at share time.
//
// It deliberately does NOT live at app/opengraph-image.tsx. That path is a
// Next.js file convention, and the convention's generated URL overrides the
// `openGraph.images` entry in app/layout.tsx — so keeping both meant og:image
// pointed at the route while twitter:image pointed at the file. One source of
// truth is the whole point of committing the PNG.
//
// After editing this file, regenerate and commit the PNG:
//   node scripts/generate-og-image.mjs
// app/__tests__/opengraph-image.test.ts fails if the committed copy goes stale
// or if text drifts outside the square-crop safe zone.

// One source of truth with the app itself: the card is drawn from the Terracotta
// ('default') preset, the same tokens the real UI paints with, so a palette
// change flows into the social preview instead of silently drifting.
//
// The DARK scheme, deliberately. The collection art is pale — the eureka pieces
// are glowing line work on transparency, and several outfits are near-white —
// so on the light surface they washed out. Against the dark surface ladder the
// same images read as luminous, which is how they look in the app's dark mode.
const { primary, secondary, surface, outline, outlineVariant } = COLOR_THEME_PRESETS.default.dark

// Satori parses woff, but not woff2 — @fontsource ships both, so we read the
// .woff sibling of the stylesheet the app already loads rather than adding a
// font dependency or a build-time conversion step.
function robotoPath(weight: 400 | 500 | 700) {
  return join(
    process.cwd(),
    'node_modules/@fontsource/roboto/files',
    `roboto-latin-${weight}-normal.woff`
  )
}

// Real game artwork, not drawn stand-ins. Satori has no filesystem or network
// access while rasterizing, so each file is inlined as a data URI up front.
// These are the local copies already shipped in public/ — the collection's own
// images live in Supabase Storage and can't be fetched at build time.
const TILE_ART = [
  // All eight are real artwork from public/quick-access. Ordered so each strip
  // opens with a high-contrast piece: the four-tile strips are what a viewer
  // scans first, and the eureka pieces are genuinely faint by design (glowing
  // line art on transparency), so they are interleaved rather than stacked.
  //
  // `faint` marks those pale pieces. They get a tinted tile instead of the
  // plain white one — on white they nearly vanish, which is exactly why the
  // real cards sit them on a surface tone too.
  { file: 'public/quick-access/fluttering-wishes-alt.png', obtained: true },
  { file: 'public/quick-access/afterglow-hands-yellow.png', obtained: true, faint: true },
  { file: 'public/quick-access/momo-cloak-starwish.png', obtained: true },
  { file: 'public/quick-access/rainbell-feet-green.png', obtained: false, faint: true },

  { file: 'public/quick-access/born-pink-hair.png', obtained: true },
  { file: 'public/quick-access/first-snow-head-white.png', obtained: true, faint: true },
  { file: 'public/quick-access/silver-feathers-base-makeup.png', obtained: false },
  { file: 'public/quick-access/perfect-start-alt.png', obtained: true },
] as const

async function dataUri(relPath: string) {
  const bytes = await readFile(join(process.cwd(), relPath))
  return `data:image/png;base64,${bytes.toString('base64')}`
}

const OBTAINED = TILE_ART.filter((t) => t.obtained).length
const PERCENT = Math.round((OBTAINED / TILE_ART.length) * 100)

// The square a center-crop leaves behind: 1200x630 cropped to square is the
// middle 630px. Everything that has to stay readable lives inside this width.
const SAFE_WIDTH = OG_SIZE.height

// A vertical run of variant tiles showing real collection artwork. These sit
// in the crop margin on purpose — they carry the product's look (obtained
// cards get the primary border and check badge, missing ones fade back)
// without holding any text a square crop could destroy.
// Unobtained tiles fade back, but a faint piece is already low contrast —
// stacking both reductions makes it read as an empty tile, so the dimming is
// gentler there. Both values sit higher on dark than they did on light, where
// the same fade left glowing art indistinguishable from the tile.
function tileOpacity({ obtained, faint }: { obtained: boolean; faint: boolean }) {
  if (obtained) return 1
  return faint ? 0.85 : 0.62
}

function TileStrip({ tiles }: { tiles: { src: string; obtained: boolean; faint: boolean }[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {tiles.map((tile) => (
        <div
          key={tile.src.slice(-24)}
          style={{
            display: 'flex',
            position: 'relative',
            width: 112,
            height: 112,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            // Faint art is glowing line work, so it reads best against the
            // DARKEST tile — the opposite of what it needed on a light surface.
            backgroundColor: tile.faint ? surface.containerLowest : surface.containerLow,
            border: tile.obtained ? `2px solid ${primary.main}` : `1px solid ${outlineVariant}`,
            opacity: tileOpacity(tile),
          }}
        >
          {/* Plain <img>: Satori rasterizes only these; next/image has no
              meaning inside an ImageResponse, and this never runs in a browser. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" height={84} src={tile.src} style={{ objectFit: 'contain' }} width={84} />
          {tile.obtained ? (
            <div
              style={{
                display: 'flex',
                position: 'absolute',
                top: 7,
                right: 7,
                width: 24,
                height: 24,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: primary.main,
              }}
            >
              {/* Drawn, not typed: Roboto's latin subset has no check glyph, and
                  a missing glyph makes Satori fetch a fallback font from Google
                  at build time — a network call that renders tofu when it fails. */}
              <svg fill="none" height="12" viewBox="0 0 12 10" width="13">
                <path
                  d="M1.5 5.2L4.4 8 10.5 1.6"
                  stroke={primary.on}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                />
              </svg>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}

export async function renderOgPng(): Promise<ArrayBuffer> {
  const [regular, medium, bold, appIcon, ...tileSrcs] = await Promise.all([
    readFile(robotoPath(400)),
    readFile(robotoPath(500)),
    readFile(robotoPath(700)),
    dataUri('app/icon.png'),
    ...TILE_ART.map((t) => dataUri(t.file)),
  ])

  const tiles = TILE_ART.map((t, i) => ({
    src: tileSrcs[i],
    obtained: t.obtained,
    faint: 'faint' in t && t.faint === true,
  }))

  const response = new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Roboto',
        // Warm terracotta wash over the dark surface ladder.
        // Satori blends each radial toward transparent BLACK, so a stop of
        // `transparent` greys the whole wash out. Fading to the surface color
        // itself keeps these tints warm instead of muddy.
        backgroundColor: surface.main,
        backgroundImage: `radial-gradient(circle at 84% 4%, ${primary.container} 0%, ${surface.main} 46%), radial-gradient(circle at 2% 98%, ${surface.containerHigh} 0%, ${surface.main} 38%)`,
      }}
    >
      {/*
        Everything meaningful is centered inside SAFE_WIDTH. Several platforms
        (WhatsApp, Slack compact previews, LinkedIn thumbnails) center-crop a
        1200x630 card to a square, which throws away 285px from each side. A
        left-aligned layout loses its headline to that crop, so the column is
        capped at the square's width and centered rather than filling the card.
        The two flanking tile strips are deliberately outside the safe zone:
        they are the only thing the crop is allowed to eat.
      */}
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 26px',
        }}
      >
        <TileStrip tiles={tiles.slice(0, 4)} />
        <TileStrip tiles={tiles.slice(4, 8)} />
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: SAFE_WIDTH,
          padding: '0 34px',
        }}
      >
        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 26 }}>
          {/* The real app icon — the same mark as the favicon and PWA install.
              Plain <img> for the same reason as the tiles above. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" height={46} src={appIcon} style={{ borderRadius: 12 }} width={46} />
          <div
            style={{
              display: 'flex',
              fontSize: 23,
              fontWeight: 500,
              letterSpacing: 0.3,
              color: surface.onVariant,
            }}
          >
            Infinity Nikki Tracker
          </div>
        </div>

        {/* Headline. Split across explicit lines so it can never rewrap wider
            than the safe zone. */}
        <div
          style={{
            display: 'flex',
            fontSize: 54,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: -1.4,
            color: surface.on,
          }}
        >
          Know exactly what
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 54,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: -1.4,
            color: primary.main,
          }}
        >
          you&apos;re missing.
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 18,
            fontSize: 23,
            lineHeight: 1.4,
            textAlign: 'center',
            color: surface.onVariant,
          }}
        >
          Track every outfit, eureka set, makeup, and Momo&apos;s cloak in one place.
        </div>

        {/* Progress bar — the product's core idea, stated visually. */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 400,
            marginTop: 30,
            padding: 18,
            borderRadius: 16,
            backgroundColor: surface.containerLowest,
            border: `1px solid ${outlineVariant}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <div style={{ display: 'flex', fontSize: 18, fontWeight: 500, color: surface.on }}>
              Collection
            </div>
            <div style={{ display: 'flex', fontSize: 17, color: outline }}>
              {OBTAINED} / {TILE_ART.length}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              height: 9,
              borderRadius: 999,
              backgroundColor: surface.variant,
            }}
          >
            <div
              style={{
                display: 'flex',
                width: `${PERCENT}%`,
                borderRadius: 999,
                backgroundColor: primary.main,
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
          {['Outfits', 'Eureka', 'Makeup', 'Cloaks'].map((label) => (
            <div
              key={label}
              style={{
                display: 'flex',
                padding: '7px 15px',
                borderRadius: 999,
                fontSize: 17,
                fontWeight: 500,
                color: secondary.onContainer,
                backgroundColor: secondary.container,
                border: `1px solid ${outlineVariant}`,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        { name: 'Roboto', data: regular, weight: 400, style: 'normal' },
        { name: 'Roboto', data: medium, weight: 500, style: 'normal' },
        { name: 'Roboto', data: bold, weight: 700, style: 'normal' },
      ],
    }
  )

  return response.arrayBuffer()
}
