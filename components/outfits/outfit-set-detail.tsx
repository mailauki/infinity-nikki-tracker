'use client'

import { useState } from 'react'
import { Stack, Typography, Chip } from '@mui/material'
import { OutfitSet } from '@/lib/types/outfit'
import { percent } from '@/hooks/count-obtained'
import { toTitle } from '@/lib/utils'
import RarityStars from '@/components/rarity-stars'
import ProgressChip from '@/components/progress-chip'
import OutfitSetImage from './outfit-set-image'
import OutfitEvolutionVariants from './outfit-evolution-variants'

export default function OutfitSetDetail({
  outfitSet,
  isLoggedIn,
}: {
  outfitSet: OutfitSet
  isLoggedIn: boolean
}) {
  const { ability, evolutions, outfit_variants, rarity, label, label_2, style, description } =
    outfitSet

  // `null` selection means "show all evolutions".
  const [selected, setSelected] = useState<string | null>(null)

  const selectedEvolution = evolutions.find((e) => e.slug === selected) ?? null

  const obtained = outfit_variants.reduce((sum, v) => sum + (v.obtained ? 1 : 0), 0)
  const total = outfit_variants.length

  return (
    <Stack direction="row" spacing={2}>
      <Stack spacing={2} sx={{ minWidth: '300px', maxWidth: '400px' }}>
        <OutfitSetImage overrideSrc={selectedEvolution?.image_url} set={outfitSet} />
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography color="textSecondary" variant="subtitle2">
            <RarityStars rarity={rarity!} />
          </Typography>
          <Stack direction="row" spacing={0.5}>
            <Chip label={toTitle(label ?? '')} variant="outlined" />
            {label_2 && <Chip label={toTitle(label_2)} variant="outlined" />}
          </Stack>
        </Stack>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography color="textSecondary" variant="body1">
            {toTitle(style ?? '')}
          </Typography>
          {isLoggedIn && <ProgressChip percentage={percent(obtained, total)} size="md" />}
        </Stack>
        {ability && <Chip label={toTitle(ability)} />}
        <Typography variant="body2">{description}</Typography>
      </Stack>

      <OutfitEvolutionVariants
        isLoggedIn={isLoggedIn}
        outfitSet={outfitSet}
        selected={selected}
        onSelect={setSelected}
      />
    </Stack>
  )
}
