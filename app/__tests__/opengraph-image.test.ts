import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

// Guards the committed static OG image. The wide card is what most platforms
// show, but several (WhatsApp, Slack compact previews, LinkedIn thumbnails)
// center-crop it to a square — so the layout deliberately keeps every readable
// element inside the middle 630px. A future layout edit that drifts text back
// out toward the edges would silently ship a card with its headline sliced in
// half; these tests fail instead.
//
// Regenerate after any change to app/opengraph-image.tsx:
//   node scripts/generate-og-image.mjs

const OG = path.join(process.cwd(), 'public/opengraph-image.png')
const SQUARE = path.join(process.cwd(), 'public/opengraph-image-square.png')

describe('static opengraph image', () => {
  it('is committed', () => {
    expect(existsSync(OG)).toBe(true)
  })

  it('is exactly 1200x630', async () => {
    const meta = await sharp(await readFile(OG)).metadata()
    expect([meta.width, meta.height]).toEqual([1200, 630])
  })

  it('has a committed 630x630 center crop', async () => {
    expect(existsSync(SQUARE)).toBe(true)
    const meta = await sharp(await readFile(SQUARE)).metadata()
    expect([meta.width, meta.height]).toEqual([630, 630])
  })

  // The real assertion: no *text* may fall outside the square-crop safe zone.
  //
  // Detected by local contrast, not by absolute brightness. An earlier version
  // looked for dark pixels, which silently stopped meaning anything when the
  // card moved to the dark palette — on a dark background every pixel is
  // "dark", and the check reported the empty margin as 272 rows of text.
  //
  // Glyph edges are high-frequency: a stem produces a sharp luminance step
  // over 1-2px, repeatedly, along a row. Artwork and the background gradient
  // are smooth by comparison. Counting sharp horizontal transitions therefore
  // finds letterforms on a light OR dark ground, and does not fire on the
  // illustration detail that a brightness threshold kept tripping over.
  it('keeps all text inside the square-crop safe zone', async () => {
    const buf = await readFile(OG)
    const { width = 0, height = 0 } = await sharp(buf).metadata()
    const left = Math.round((width - height) / 2)

    const margins: [string, number, number][] = [
      ['left', 0, left],
      ['right', left + height, width],
    ]

    for (const [name, x0, x1] of margins) {
      // Greyscale: only luminance structure matters here.
      const { data, info } = await sharp(buf)
        .extract({ left: x0, top: 0, width: x1 - x0, height })
        .greyscale()
        .raw()
        .toBuffer({ resolveWithObject: true })

      const at = (x: number, y: number) => data[(y * info.width + x) * info.channels]

      // A step of 60+ grey levels across 2px is an edge; text packs many such
      // edges into one row (both sides of every stem).
      //
      // The threshold is measured, not guessed. On the current card the tile
      // borders and artwork give the margins at most 30 edges in any row,
      // while a row of injected 40px text reaches 49. 38 sits between the two
      // with margin on both sides — high enough that illustration never trips
      // it, low enough that a real word cannot hide under it.
      const EDGE = 60
      const EDGES_PER_TEXT_ROW = 38

      let textRows = 0
      for (let y = 0; y < info.height; y++) {
        let edges = 0
        for (let x = 2; x < info.width; x++) {
          if (Math.abs(at(x, y) - at(x - 2, y)) >= EDGE) edges++
        }
        if (edges >= EDGES_PER_TEXT_ROW) textRows++
      }

      expect(textRows, `${name} crop margin should contain no text`).toBe(0)
    }
  })
})
