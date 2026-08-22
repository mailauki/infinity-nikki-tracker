import { ImageResponse } from 'next/og'
import { cacheLife } from 'next/cache'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { COLOR_THEME_PRESETS } from '@/lib/theme-presets'

// Route segment config. `alt` is the og:image:alt tag, so it has to describe the
// picture for anyone whose reader announces it rather than renders it.
export const alt =
  'Infinity Nikki Tracker — a browser window showing a grid of collectible outfit pieces, some marked as obtained, with a collection progress bar'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Under Cache Components a metadata route is dynamic unless it opts in, and
// this image has no request-dependent input — every hit would re-rasterize
// identical bytes. `use cache` can't wrap the handler itself (ImageResponse is
// a class instance and cached values must be serializable), so the cache wraps
// the PNG buffer instead and the handler just serves it.

// One source of truth with the app itself: the card is drawn from the Terracotta
// ('default') preset's light scheme, the same tokens the real UI paints with, so
// a palette change flows into the social preview instead of silently drifting.
const { primary, secondary, surface, outline, outlineVariant } = COLOR_THEME_PRESETS.default.light

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

// The mockup's collection grid. Each tile stands in for a real variant card:
// a tinted "garment" shape over the card surface, with obtained tiles carrying
// the primary-tinted border and check badge the live cards use.
const TILES: { tint: string; obtained: boolean }[] = [
  { tint: '#BFD9EA', obtained: true },
  { tint: '#E7C6D4', obtained: true },
  { tint: '#F0DCA8', obtained: true },
  { tint: '#C9DFC0', obtained: false },
  { tint: '#D6C8E4', obtained: true },
  { tint: '#F2CDB6', obtained: true },
  { tint: '#B8D6D9', obtained: false },
  { tint: '#EBD3C0', obtained: true },
  { tint: '#D9C4B4', obtained: false },
  { tint: '#C6D3EC', obtained: true },
]

const OBTAINED = TILES.filter((t) => t.obtained).length
const PERCENT = Math.round((OBTAINED / TILES.length) * 100)

async function renderPng(): Promise<ArrayBuffer> {
  'use cache'
  cacheLife('max')

  const [regular, medium, bold] = await Promise.all([
    readFile(robotoPath(400)),
    readFile(robotoPath(500)),
    readFile(robotoPath(700)),
  ])

  const response = new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '56px 64px',
        fontFamily: 'Roboto',
        // Warm terracotta wash, matching the app's light surface ladder.
        // Satori blends each radial toward transparent BLACK, so a stop of
        // `transparent` greys the whole wash out. Fading to the surface color
        // itself keeps these tints warm instead of muddy.
        backgroundColor: surface.main,
        backgroundImage: `radial-gradient(circle at 82% 6%, ${primary.container} 0%, ${surface.main} 52%), radial-gradient(circle at 2% 96%, ${secondary.container} 0%, ${surface.main} 42%)`,
      }}
    >
      {/* Wordmark row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 52,
            height: 52,
            borderRadius: 14,
            backgroundColor: primary.main,
          }}
        >
          {/* Drawn, not typed. Roboto's latin subset has no ∞ or ✓, and a
                missing glyph makes Satori reach out to Google Fonts at build
                time — a network call that renders tofu when it fails. Every
                non-ASCII mark in this image is an inline SVG for that reason. */}
          <svg fill="none" height="17" viewBox="0 0 44 22" width="30">
            <path
              d="M22 11c-3.4-4.8-6-7.4-9.6-7.4a7.4 7.4 0 000 14.8c3.6 0 6.2-2.6 9.6-7.4zm0 0c3.4-4.8 6-7.4 9.6-7.4a7.4 7.4 0 010 14.8c-3.6 0-6.2-2.6-9.6-7.4z"
              stroke={primary.on}
              strokeWidth="3"
            />
          </svg>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 25,
            fontWeight: 500,
            letterSpacing: 0.3,
            color: surface.onVariant,
          }}
        >
          Infinity Nikki Tracker
        </div>
      </div>

      {/* Body: pitch on the left, product mockup on the right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 52 }}>
        <div style={{ display: 'flex', flexDirection: 'column', width: 470 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 55,
              fontWeight: 700,
              lineHeight: 1.12,
              letterSpacing: -1.5,
              color: surface.on,
            }}
          >
            Know exactly what
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 55,
              fontWeight: 700,
              lineHeight: 1.12,
              letterSpacing: -1.5,
              color: primary.main,
            }}
          >
            you&apos;re missing.
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 22,
              fontSize: 25,
              lineHeight: 1.42,
              color: surface.onVariant,
            }}
          >
            Track every outfit, Eureka set, makeup look, and Momo&apos;s cloak in one place.
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 30 }}>
            {['Outfits', 'Eureka', 'Makeup', "Momo's Cloaks"].map((label) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  padding: '9px 17px',
                  borderRadius: 999,
                  fontSize: 19,
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

        {/* Product mockup: a browser window framing the collection grid */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 512,
            borderRadius: 18,
            overflow: 'hidden',
            backgroundColor: surface.containerLowest,
            border: `1px solid ${outlineVariant}`,
            boxShadow: '0 26px 60px rgba(50, 18, 0, 0.20)',
          }}
        >
          {/* Window chrome */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              height: 36,
              paddingLeft: 16,
              backgroundColor: surface.containerHigh,
              borderBottom: `1px solid ${outlineVariant}`,
            }}
          >
            {['#E8705F', '#E7B44C', '#79B865'].map((dot) => (
              <div
                key={dot}
                style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: dot }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', padding: 20 }}>
            {/* Progress header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', fontSize: 19, fontWeight: 500, color: surface.on }}>
                Collection
              </div>
              <div style={{ display: 'flex', fontSize: 17, color: outline }}>
                {OBTAINED} / {TILES.length}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                height: 8,
                borderRadius: 999,
                backgroundColor: surface.variant,
                marginBottom: 18,
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

            {/* Card grid — 5 across, mirroring the live variant grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {TILES.map((tile, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    position: 'relative',
                    width: 86,
                    height: 86,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: surface.containerLow,
                    border: tile.obtained
                      ? `2px solid ${primary.main}`
                      : `1px solid ${outlineVariant}`,
                    opacity: tile.obtained ? 1 : 0.55,
                  }}
                >
                  {/* Abstract garment silhouette: a bodice with flared skirt. */}
                  <div
                    style={{
                      display: 'flex',
                      width: 46,
                      height: 52,
                      backgroundColor: tile.tint,
                      borderRadius: '50% 50% 42% 42% / 26% 26% 58% 58%',
                    }}
                  />
                  {tile.obtained ? (
                    <div
                      style={{
                        display: 'flex',
                        position: 'absolute',
                        top: 5,
                        right: 5,
                        width: 21,
                        height: 21,
                        borderRadius: 999,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: primary.main,
                      }}
                    >
                      <svg fill="none" height="11" viewBox="0 0 12 10" width="12">
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
          </div>
        </div>
      </div>

      {/* Footer strip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', fontSize: 20, color: outline }}>
          Free to browse · Sign in to track your own collection
        </div>
        <div style={{ display: 'flex', fontSize: 20, fontWeight: 500, color: primary.main }}>
          {PERCENT}% complete
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: 'Roboto', data: regular, weight: 400, style: 'normal' },
        { name: 'Roboto', data: medium, weight: 500, style: 'normal' },
        { name: 'Roboto', data: bold, weight: 700, style: 'normal' },
      ],
    }
  )

  return response.arrayBuffer()
}

export default async function OpengraphImage() {
  const png = await renderPng()

  return new Response(png, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  })
}
