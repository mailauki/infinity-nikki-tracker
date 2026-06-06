'use client'

import { useState } from 'react'
import { toTitle } from '@/lib/utils'
import { EurekaVariant } from '@/lib/types/eureka'
import { Box, Card, Grow, IconButton, Stack, Typography } from '@mui/material'
import { Category, RadioButtonUncheckedOutlined, TaskAlt } from '@mui/icons-material'
import { useEurekaData } from './eureka-context'
import LazyAvatar from '../lazy-avatar'

export default function EurekaVariantCard({
  eurekaVariant,
  isLoggedIn,
  isMissingFilter = false,
}: {
  eurekaVariant: EurekaVariant
  isLoggedIn: boolean
  isMissingFilter?: boolean
}) {
  const { onToggleObtained } = useEurekaData()
  const [exiting, setExiting] = useState(false)

  function onToggle() {
    if (isMissingFilter) {
      setExiting(true)
    } else {
      onToggleObtained(eurekaVariant.eureka_set!, eurekaVariant.category!, eurekaVariant.color!)
    }
  }

  function onExited() {
    onToggleObtained(eurekaVariant.eureka_set!, eurekaVariant.category!, eurekaVariant.color!)
  }

  return (
    <Grow in={!exiting} timeout={300} onExited={onExited}>
      <Card
        sx={{
          minWidth: 'fit-content',
					bgcolor: eurekaVariant.obtained ? 'surface.containerLow' : 'surface.containerHighest'
        }}
      >
        <Box sx={{ position: 'relative', height: '100%' }}>
          <Stack sx={{ pt: 1, alignItems: 'center' }}>
            <LazyAvatar
              alt={eurekaVariant.slug || 'Eureka Variant'}
              color="transparent"
              size="lg"
              src={eurekaVariant.image_url!}
              sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
            >
              <Category fontSize="inherit" />
            </LazyAvatar>
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
              {toTitle(eurekaVariant.category ?? '')} • {toTitle(eurekaVariant.color ?? '')}
            </Typography>
          </Stack>
          <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
            {isLoggedIn && (
              <IconButton onClick={onToggle}>
                {eurekaVariant.obtained ? <TaskAlt /> : <RadioButtonUncheckedOutlined />}
              </IconButton>
            )}
          </Box>
        </Box>
      </Card>
    </Grow>
  )
}
