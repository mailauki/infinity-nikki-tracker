'use client'

import { useState } from 'react'
import { Stack, Typography, Chip } from '@mui/material'
import { OutfitSet } from '@/lib/types/outfit'
import { percent } from '@/hooks/count-obtained'
import { toTitle } from '@/lib/utils'
import RarityStars from '@/components/rarity-stars'
import ProgressChip from '@/components/progress-chip'
import SlugToolBar from '@/components/slug-toolbar'
import OutfitSetImage from './outfit-set-image'
import OutfitEvolutionVariants from './outfit-evolution-variants'
import { OutfitImageModeProvider } from './outfit-image-mode-context'

export default function OutfitSetDetail({
  outfitSet,
  isLoggedIn,
  isAdmin,
}: {
  outfitSet: OutfitSet
  isLoggedIn: boolean
  isAdmin: boolean
}) {
  const { ability, evolutions, outfit_variants, rarity, label, label_2, style, description } =
    outfitSet

  // `null` selection means "show all evolutions".
  const [selected, setSelected] = useState<string | null>(null)
  const [showAlt, setShowAlt] = useState(false)

  const selectedEvolution = evolutions.find((e) => e.slug === selected) ?? null

  // Resolve the poster image, honoring the selected evolution and the alt
  // toggle, falling back to the normal image when no alt exists.
  const altSrc = selectedEvolution ? selectedEvolution.alt_image_url : outfitSet.alt_image_url
  const showingAlt = showAlt && !!altSrc
  const posterSrc = selectedEvolution
    ? (showingAlt && altSrc) || selectedEvolution.image_url
    : (showingAlt && altSrc) || outfitSet.poster_image_url || outfitSet.image_url

  const obtained = outfit_variants.reduce((sum, v) => sum + (v.obtained ? 1 : 0), 0)
  const total = outfit_variants.length

  return (
    <OutfitImageModeProvider value={{ showAlt, toggleAlt: () => setShowAlt((v) => !v) }}>
      <SlugToolBar isAdmin={isAdmin} />
      <Stack direction="row" spacing={2}>
        <Stack spacing={2} sx={{ minWidth: '300px', maxWidth: '400px' }}>
          <OutfitSetImage overrideSrc={posterSrc} set={outfitSet} square={showingAlt} />
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
    </OutfitImageModeProvider>
  )
}
