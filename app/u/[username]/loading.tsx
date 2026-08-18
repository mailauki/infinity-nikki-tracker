import { Box, Card, Divider, Skeleton, Stack } from '@mui/material'

// The Profile tab is the default, so the fallback mirrors that: a full-bleed
// hero card filling the viewport, with the identity block and stat row overlaid
// along its bottom edge. Geometry tracks ProfileCard — 94px avatar (LazyImage
// `lg`), CardHeader's 16px gutters, and the four-stat ProfileStats row.
//
// The height is a plain viewport calc rather than the measured fill ProfileCard
// uses: this renders before the toolbar and sticky-bar portals exist, so there
// is nothing to measure yet. Slight overshoot is invisible under `overflow:
// hidden`, and the real card takes over the moment data resolves.
const AVATAR_PX = 94

function HeroSkeleton() {
  return (
    <Card
      surface="base"
      sx={{ position: 'relative', borderRadius: 0, height: '100%', overflow: 'hidden', mx: 1 }}
    >
      {/* Stands in for the banner image behind the gradient. */}
      <Skeleton
        animation="wave"
        sx={{ position: 'absolute', inset: 0, height: '100%', transform: 'none' }}
        variant="rectangular"
      />

      <Stack sx={{ position: 'absolute', bottom: 0, left: 0, width: '100%', pt: 8 }}>
        <Stack sx={{ px: 2 }}>
          <Skeleton height={AVATAR_PX} variant="circular" width={AVATAR_PX} />
        </Stack>

        {/* Mirrors CardHeader: title + subheader on the left, action on the right. */}
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: 'center', justifyContent: 'space-between', p: 2 }}
        >
          <Stack spacing={0.5} sx={{ flexGrow: 1, minWidth: 0 }}>
            <Skeleton height={32} variant="text" width={200} />
            <Skeleton height={20} variant="text" width={120} />
          </Stack>
          <Skeleton
            height={42}
            sx={{ borderRadius: 40, flexShrink: 0 }}
            variant="rounded"
            width={150}
          />
        </Stack>

        <Box sx={{ px: 2, pb: 12 }}>
          <ProfileStatsSkeleton />
        </Box>
      </Stack>
    </Card>
  )
}

// Mirrors ProfileStats: a row of four centered stat pairs split by dividers.
function ProfileStatsSkeleton() {
  return (
    <Stack
      direction="row"
      divider={<Divider flexItem orientation="vertical" variant="middle" />}
      spacing={{ xs: 1, sm: 2, md: 3 }}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <Stack key={i} spacing={0.5} sx={{ alignItems: 'center', flexGrow: { xs: 1, md: 0 } }}>
          <Skeleton height={16} variant="text" width={72} />
          <Skeleton height={28} variant="text" width={40} />
        </Stack>
      ))}
    </Stack>
  )
}

// Chrome above the card while this fallback is up: the AppBar row, its 16px mask
// spacer, and the toolbar row carrying the profile tabs. Toolbar height is
// responsive (56 / 48 landscape / 64 at sm+), so the reserved height tracks the
// same breakpoints LayoutShell uses. Ordered so the sm+ query wins over the
// landscape one, which otherwise both match on a desktop viewport.
const MASK_SPACER = 16
const FILL_HEIGHT = {
  height: `calc(100dvh - ${56 * 2 + MASK_SPACER}px)`,
  '@media (orientation: landscape)': { height: `calc(100dvh - ${48 * 2 + MASK_SPACER}px)` },
  '@media (min-width:600px)': { height: `calc(100dvh - ${64 * 2 + MASK_SPACER}px)` },
}

export default function ProfileLoading() {
  return (
    // Matches ProfileTabsContent's full-bleed wrapper: cancel the <main> gutter
    // so the hero spans the content column edge to edge.
    <Box sx={{ mx: -2, overflow: 'hidden', ...FILL_HEIGHT }}>
      <HeroSkeleton />
    </Box>
  )
}
