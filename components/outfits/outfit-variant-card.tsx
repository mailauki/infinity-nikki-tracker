'use client'

import { useState } from 'react'
import { Box, Card, Grow, IconButton, Stack, Typography } from '@mui/material'
import { Category, RadioButtonUncheckedOutlined, TaskAlt } from '@mui/icons-material'
import { OutfitVariant } from '@/lib/types/outfit'
import { toTitle } from '@/lib/utils'
import LazyImage from '@/components/lazy-image'
import { useOutfitData } from './outfit-context'
import { useOutfitImageMode } from './outfit-image-mode-context'

export default function OutfitVariantCard({
  outfitVariant,
  isLoggedIn,
  isMissingFilter = false,
}: {
  outfitVariant: OutfitVariant
  isLoggedIn: boolean
  isMissingFilter?: boolean
}) {
  const { onToggleObtained } = useOutfitData()
  const { mode } = useOutfitImageMode()
  const [exiting, setExiting] = useState(false)

  // Variants have no poster image, so only alt mode differs from the default.
  const imageSrc =
    (mode === 'alt' && outfitVariant.alt_image_url) || outfitVariant.image_url || undefined

  function onToggle() {
    if (isMissingFilter) {
      setExiting(true)
    } else {
      onToggleObtained(
        outfitVariant.outfit_set!,
        outfitVariant.outfit_category!,
        outfitVariant.evolution ?? null
      )
    }
  }

  function onExited() {
    onToggleObtained(
      outfitVariant.outfit_set!,
      outfitVariant.outfit_category!,
      outfitVariant.evolution ?? null
    )
  }

  const categoryLabel = toTitle(outfitVariant.outfit_category ?? '')
  const evolutionLabel = outfitVariant.evolution
    ? toTitle(outfitVariant.evolution.split('-')[1])
    : 'Base'

  return (
    <Grow in={!exiting} timeout={300} onExited={onExited}>
      <Card
        sx={{
          minWidth: 'fit-content',
          bgcolor: outfitVariant.obtained ? 'surface.containerLow' : 'surface.containerHighest',
        }}
      >
        <Box sx={{ position: 'relative', height: '100%' }}>
          <Stack sx={{ pt: 1, alignItems: 'center' }}>
            <LazyImage
              alt={outfitVariant.slug || 'Outfit Variant'}
              color="transparent"
              size="lg"
              src={imageSrc}
              sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
            >
              <Category fontSize="inherit" />
            </LazyImage>
          </Stack>
          <Stack
            direction="row"
            sx={{
              py: 0.75,
              px: 1.25,
              my: 0,
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography color="textSecondary" variant="caption">
              {categoryLabel} • {evolutionLabel}
            </Typography>
          </Stack>
          <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
            {isLoggedIn && (
              <IconButton
                aria-label={outfitVariant.obtained ? 'Mark as not obtained' : 'Mark as obtained'}
                onClick={onToggle}
              >
                {outfitVariant.obtained ? <TaskAlt /> : <RadioButtonUncheckedOutlined />}
              </IconButton>
            )}
          </Box>
        </Box>
      </Card>
    </Grow>
  )
}
