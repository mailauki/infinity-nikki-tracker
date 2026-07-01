'use client'

import { useEffect, useState } from 'react'
import { Evolution, OutfitSet } from '@/lib/types/outfit'
import { isGlowup } from '@/hooks/outfit'
import { RadioButtonUncheckedOutlined, TaskAlt } from '@mui/icons-material'
import { Box, Card, CardActionArea, Grow, IconButton, Stack, Typography } from '@mui/material'
import RarityStars from '@/components/rarity-stars'
import Link from 'next/link'
import { toTitle } from '@/lib/utils'
import LazyImage from '@/components/lazy-image'
import {
  resolveOutfitImage,
  useOutfitImageMode,
} from '@/components/outfits/outfit-image-mode-context'
import ToggleIcon from '@/components/toggle-icon'
import ProgressChip from '@/components/progress-chip'

export default function OutfitSetCard({
  set,
  evolution = null,
  isLoggedIn,
  obtained,
  total,
  onToggle,
  isMissingFilter = false,
  shouldHide = false,
}: {
  set: OutfitSet
  // When provided, the card represents this evolution of the set (its image,
  // title, and link); otherwise it represents the base set.
  evolution?: Evolution | null
  isLoggedIn: boolean
  obtained: number
  total: number
  onToggle: () => void
  // When the "missing" filter is active, completing this group animates the
  // card out (the obtained toggle is committed in onExited) so it leaves the
  // filtered view smoothly instead of vanishing instantly.
  isMissingFilter?: boolean
  // When true (e.g. an evolution card while "hide evolutions" is active), the
  // card animates out and stays unmounted.
  shouldHide?: boolean
}) {
  const { mode } = useOutfitImageMode()
  const [grown, setGrown] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => setGrown(true), [])

  // Animate out when this card should be hidden by a filter change, and grow
  // back in when the filter is cleared.
  useEffect(() => {
    setExiting(shouldHide)
  }, [shouldHide])

  function handleToggle() {
    onToggle()
    if (isMissingFilter) {
      setExiting(true)
    }
  }

  const href = evolution
    ? `/outfits/${evolution.slug.replace('-', '?evolution=')}`
    : `/outfits/${set.slug}`
  const title = evolution ? `${set.title}: ${toTitle(evolution.title)}` : set.title

  const imageSrc = evolution
    ? resolveOutfitImage(mode, { image: evolution.image_url, alt: evolution.alt_image_url })
    : resolveOutfitImage(mode, { image: set.image_url, alt: set.alt_image_url })
  const showingAlt = mode === 'alt' && !!(evolution ? evolution.alt_image_url : set.alt_image_url)

  const glowup = !!evolution && isGlowup(evolution)

  return (
    <Grow unmountOnExit in={grown && !exiting} timeout={300}>
      <Card sx={{ flexGrow: 1, position: 'relative' }}>
        <CardActionArea component={Link} href={href}>
          {showingAlt ? (
            <LazyImage alt={title} kind="square" src={imageSrc || set.image_url || ''} />
          ) : (
            <LazyImage
              image={imageSrc || set.image_url || ''}
              kind="media"
              sx={{ width: '100%', aspectRatio: '2 / 3' }}
              title={title}
            />
          )}
        </CardActionArea>
        <Stack
          direction="row"
          sx={{ px: 1, alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Stack spacing={1} sx={{ px: 1, py: 2, maxWidth: 'calc(100% - 40px)' }}>
            <Typography noWrap variant="overline">
              {title}
            </Typography>
            <RarityStars rarity={set.rarity} />
          </Stack>
          {isLoggedIn && (
            <IconButton
              aria-label={obtained ? 'Mark as not obtained' : 'Mark as obtained'}
              onClick={handleToggle}
            >
              {obtained === total ? <TaskAlt /> : <RadioButtonUncheckedOutlined />}
            </IconButton>
          )}
        </Stack>
        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
          {isLoggedIn && <ProgressChip obtained={obtained} total={total} variant="parts" />}
        </Box>
        <Box sx={{ position: 'absolute', top: 12, left: 12 }}>
          {evolution && !glowup && (
            <ToggleIcon item={{ title: 'evolution', image: '/icons/evolution.png' }} size="xs" />
          )}
          {glowup && (
            <ToggleIcon item={{ title: 'glowup', image: '/icons/glowup.png' }} size="xs" />
          )}
        </Box>
      </Card>
    </Grow>
  )
}
