'use client'

import { toTitle } from '@/lib/utils'
import { EurekaVariant } from '@/lib/types/eureka'
import { Avatar, Box, Card, IconButton, LinearProgress, Stack, Typography } from '@mui/material'
import { Category, RadioButtonUncheckedOutlined, TaskAlt } from '@mui/icons-material'
import { handleObtained } from '@/app/(main)/eureka/actions'

export default function EurekaVariantCard({
  eurekaVariant,
  isLoggedIn,
}: {
  eurekaVariant: EurekaVariant
  isLoggedIn: boolean
}) {
  return (
    <Card
      data-active={eurekaVariant.obtained ? '' : undefined}
      sx={{
        minWidth: 'fit-content',
        '&[data-active]': {
          backgroundColor: 'action.selected',
          '&:hover': {
            backgroundColor: 'action.selectedHover',
          },
        },
      }}
    >
      <Box sx={{ position: 'relative', height: '100%' }}>
        <Stack alignItems="center" sx={{ pt: 1 }}>
          <Avatar
            alt={eurekaVariant.slug || 'Eureka Variant'}
            color="transparent"
            size="lg"
            src={eurekaVariant.image_url!}
          >
            <Category fontSize="inherit" />
          </Avatar>
        </Stack>
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
          sx={{ py: 0.75, px: 1.25, mb: !isLoggedIn ? 0.5 : 0, mt: -2 }}
        >
          <Typography color="textSecondary" variant="caption">
            {toTitle(eurekaVariant.category ?? '')} • {toTitle(eurekaVariant.color ?? '')}
          </Typography>
        </Stack>
        {isLoggedIn && (
          <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
            <LinearProgress
              color="inherit"
              value={eurekaVariant.obtained ? 100 : 0}
              variant="determinate"
            />
          </Box>
        )}
        <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
          {isLoggedIn && (
            <IconButton
              disabled={!isLoggedIn}
              onClick={() =>
                handleObtained(
                  eurekaVariant.eureka_set!,
                  eurekaVariant.category!,
                  eurekaVariant.color!
                )
              }
            >
              {eurekaVariant.obtained ? <TaskAlt /> : <RadioButtonUncheckedOutlined />}
            </IconButton>
          )}
        </Box>
      </Box>
    </Card>
  )
}
