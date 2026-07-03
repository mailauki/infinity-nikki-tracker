'use client'

import { useState } from 'react'
import { Box, Card, CardHeader, Grow, IconButton, Stack } from '@mui/material'
import { Category, RadioButtonUncheckedOutlined, TaskAlt } from '@mui/icons-material'
import { OutfitVariant } from '@/lib/types/outfit'
import { toTitle } from '@/lib/utils'
import LazyImage from '@/components/lazy-image'
import { useOutfitData } from '@/components/outfits/outfit-context'
import { useOutfitImageMode } from '@/components/outfits/outfit-image-mode-context'
import ToggleIcon from '@/components/toggle-icon'
import { categoryIconSrc } from '@/lib/look-utils'

export default function OutfitVariantCard({
  outfitVariant,
  isLoggedIn,
  isMissingFilter = false,
  disableToggle = false,
}: {
  outfitVariant: OutfitVariant
  isLoggedIn: boolean
  isMissingFilter?: boolean
  disableToggle?: boolean
}) {
  const { onToggleObtained } = useOutfitData()
  const { mode } = useOutfitImageMode()
  const [exiting, setExiting] = useState(false)

  // Variants have no poster image, so only alt mode differs from the default.
  const imageSrc =
    (mode === 'alt' && outfitVariant.alt_image_url) || outfitVariant.image_url || undefined

  function onToggle() {
    onToggleObtained(outfitVariant.outfit_set!, outfitVariant.outfit_category!, outfitVariant.slug)
    if (isMissingFilter) {
      setExiting(true)
    }
  }

  const categoryLabel = toTitle(outfitVariant.outfit_category ?? '')

  return (
    <Grow in={!exiting} timeout={300}>
      <Card
        elevation={outfitVariant.obtained ? 3 : 1}
        sx={{
          position: 'relative',
          flexGrow: 1,
        }}
      >
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
        <CardHeader
          action={
            isLoggedIn &&
            !disableToggle && (
              <IconButton
                aria-label={outfitVariant.obtained ? 'Mark as not obtained' : 'Mark as obtained'}
                onClick={onToggle}
              >
                {outfitVariant.obtained ? <TaskAlt /> : <RadioButtonUncheckedOutlined />}
              </IconButton>
            )
          }
          slotProps={{
            title: { variant: 'subtitle2', noWrap: true },
            subheader: { variant: 'caption' },
          }}
          subheader={categoryLabel}
          sx={{ pr: 1, '& .MuiCardHeader-content': { maxWidth: 'calc(100% - 40px)' } }}
          title={outfitVariant.title && outfitVariant.title}
        />
        <Box sx={{ position: 'absolute', top: 12, left: 12 }}>
          <ToggleIcon
            item={{
              title: categoryLabel,
              image: categoryIconSrc(outfitVariant.outfit_category || ''),
            }}
            size="xs"
          />
        </Box>
      </Card>
    </Grow>
  )
}
