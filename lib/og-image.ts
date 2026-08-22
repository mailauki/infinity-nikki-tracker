// Shared description of the OpenGraph card, used by both the generated route
// (app/opengraph-image.tsx, as its `alt` export) and the static metadata in
// app/layout.tsx. One string so the two can't describe the same picture
// differently.
export const OG_ALT =
  'Infinity Nikki Tracker — the headline "Know exactly what you\'re missing" above a collection progress bar, flanked by cards of real Infinity Nikki outfit and eureka artwork, some marked obtained'

/** Card dimensions. The 630px height doubles as the safe-zone width: a square
 *  center-crop keeps exactly the middle `OG_SIZE.height` pixels. */
export const OG_SIZE = { width: 1200, height: 630 } as const
