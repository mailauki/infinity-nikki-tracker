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
  // Text is detected as dark pixels that cluster into horizontal runs — a
  // glyph stem is several dark pixels wide on a row, and a word is many such
  // runs on the same rows. Real artwork also contains dark pixels (the dress
  // in the left strip has dark seam detail), so a naive "any dark pixel"
  // check reports those as text. Counting only sustained runs separates a
  // letterform from a few dark pixels of illustration.
  it('keeps all text inside the square-crop safe zone', async () => {
    const buf = await readFile(OG)
    const { width = 0, height = 0 } = await sharp(buf).metadata()
    const left = Math.round((width - height) / 2)

    const margins: [string, number, number][] = [
      ['left', 0, left],
      ['right', left + height, width],
    ]

    for (const [name, x0, x1] of margins) {
      const { data, info } = await sharp(buf)
        .extract({ left: x0, top: 0, width: x1 - x0, height })
        .raw()
        .toBuffer({ resolveWithObject: true })

      const isDark = (x: number, y: number) => {
        const i = (y * info.width + x) * info.channels
        return data[i] < 80 && data[i + 1] < 80 && data[i + 2] < 80
      }

      // A run of >= 3 dark px is stem-like; >= 4 such runs on one row is
      // word-like. Neither triggers on scattered illustration detail.
      let textRows = 0
      for (let y = 0; y < info.height; y++) {
        let runs = 0
        let run = 0
        for (let x = 0; x < info.width; x++) {
          if (isDark(x, y)) {
            run++
          } else {
            if (run >= 3) runs++
            run = 0
          }
        }
        if (run >= 3) runs++
        if (runs >= 4) textRows++
      }

      expect(textRows, `${name} crop margin should contain no text`).toBe(0)
    }
  })
})
