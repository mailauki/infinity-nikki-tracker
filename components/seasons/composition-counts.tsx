import { Box, Stack, Typography } from '@mui/material'
import { Circle, Workspaces } from '@mui/icons-material'

// Below this container width there is only room for the icon form. 600 is the
// same sm threshold the grid presets use, and it sits well clear of both call
// sites as measured: a category header spans ~913px of the content column, a
// contents row ~290px inside the sidebar. So the section headers write words
// and the sidebar rows stay compact, but either flips if its container actually
// changes — a narrow window, a wider drawer — rather than being pinned by which
// component it is in.
const LABEL_MIN_WIDTH = 600

// Put this on the ancestor whose width should decide the form — the category
// header in the grid, the row in the contents sidebar. Pairs with the container
// queries inside Count below.
export const COMPOSITION_CONTAINER = { containerType: 'inline-size' as const }

// How many outfits and pieces a season category holds, optionally as
// collected/total. Shared by the season page's category headers and its contents
// sidebar, which is why it adapts rather than taking a variant prop. (The
// seasons index deliberately does NOT use it: its rows report one card total
// each, matching the season progress chip rather than splitting by kind.)
//
// The two call sites have very different room: a sidebar row sits in a narrow
// drawer beside its title, a category header spans the content column.
// Rather than hard-code "icons here, words there" — which breaks as soon as a
// card is resized, the drawer opens, or the viewport narrows — each instance
// picks the form that fits the space it actually got. Wide enough for words, it
// writes "8 outfits"; narrower, it falls back to "8 ⧉".
//
// Both forms carry the same aria-label, so the spoken output never changes with
// the layout: the words are decoration for sighted readers, not content.
//
// The query reads the NEAREST inline-size container, which must be an ancestor
// that owns real width — this component's own row shrink-wraps its content, so
// making it the container would just measure itself. Call sites wrap it in
// COMPOSITION_CONTAINER on the element whose space should decide.
function Count({
  value,
  obtained,
  singular,
  plural,
  icon,
}: {
  value: number
  obtained?: number
  singular: string
  plural: string
  icon: React.ReactNode
}) {
  const label = value === 1 ? singular : plural
  const shown = obtained === undefined ? `${value}` : `${obtained}/${value}`

  return (
    <Typography
      aria-label={
        obtained === undefined ? `${value} ${label}` : `${obtained} of ${value} ${label} collected`
      }
      color="text.secondary"
      component="span"
      size="small"
      sx={{ alignItems: 'center', display: 'inline-flex', gap: 0.5, whiteSpace: 'nowrap' }}
      variant="body"
    >
      {shown}
      {/* Exactly one of these renders at a time — the container query swaps
          them — and both are aria-hidden so neither reaches the label above. */}
      <Box
        aria-hidden
        component="span"
        sx={{
          display: 'inline-flex',
          [`@container (min-width: ${LABEL_MIN_WIDTH}px)`]: { display: 'none' },
        }}
      >
        {icon}
      </Box>
      <Box
        aria-hidden
        component="span"
        sx={{
          display: 'none',
          [`@container (min-width: ${LABEL_MIN_WIDTH}px)`]: { display: 'inline' },
        }}
      >
        {label}
      </Box>
    </Typography>
  )
}

export default function CompositionCounts({
  outfits,
  pieces,
  obtainedOutfits,
  obtainedPieces,
}: {
  outfits: number
  pieces: number
  // Omit both to show plain totals rather than collected/total — the logged-out
  // and index cases, which have no collection to report against.
  obtainedOutfits?: number
  obtainedPieces?: number
}) {
  if (outfits === 0 && pieces === 0) return null

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      {outfits > 0 && (
        <Count
          icon={<Workspaces color="action" fontSize="inherit" />}
          obtained={obtainedOutfits}
          plural="outfits"
          singular="outfit"
          value={outfits}
        />
      )}
      {pieces > 0 && (
        <Count
          icon={<Circle color="action" fontSize="inherit" sx={{ fontSize: 8 }} />}
          obtained={obtainedPieces}
          plural="pieces"
          singular="piece"
          value={pieces}
        />
      )}
    </Stack>
  )
}
