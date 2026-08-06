'use client'

import { Chip, Stack, Typography } from '@mui/material'
import { MakeupSet, MakeupVariant } from '@/lib/types/makeup'
import CardShell from '@/components/card-shell'
import LazyImage from '@/components/lazy-image'
import ProgressChip from '@/components/progress-chip'
import RarityStars from '@/components/rarity-stars'
import ToggleIcon from '@/components/toggle-icon'

// A makeup card: either the base set (evolution === null) or one of its
// evolutions. Built on CardShell rather than SetCard because SetCard requires an
// `href` and an `onToggle` that makeup cannot supply yet — the public makeup
// route is still a Coming Soon stub and obtained_makeup has no provider-backed
// toggle. Presentation matches the outfit cards so the sections stay uniform.
export default function MakeupSetCard({
  set,
  evolution,
  variants,
  isLoggedIn,
}: {
  set: MakeupSet
  evolution: MakeupSet | null
  variants: MakeupVariant[]
  isLoggedIn: boolean
}) {
  const total = variants.length
  const obtained = variants.reduce((sum, variant) => sum + (variant.obtained ? 1 : 0), 0)

  const row = evolution ?? set
  const imageSrc = row.alt_image_url || row.image_url || ''

  return (
    <CardShell
      in
      topLeft={
        evolution ? (
          <ToggleIcon image="/icons/evolution.png" size="xs" title="evolution" />
        ) : undefined
      }
      topRight={
        isLoggedIn ? <ProgressChip obtained={obtained} total={total} variant="parts" /> : undefined
      }
    >
      <LazyImage
        image={imageSrc}
        kind="media"
        sx={{ width: '100%', aspectRatio: '2 / 3' }}
        title={row.title}
      />
      <Stack spacing={1} sx={{ px: 2, py: 2 }}>
        <Typography noWrap variant="overline">
          {row.title}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <RarityStars rarity={row.rarity} />
          <Chip label="Makeup" size="small" sx={{ ml: 'auto' }} variant="outlined" />
        </Stack>
      </Stack>
    </CardShell>
  )
}
