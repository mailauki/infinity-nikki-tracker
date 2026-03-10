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
    <Card variant={eurekaVariant.obtained ? 'elevation' : 'outlined'}>
      <Box sx={{ position: 'relative' }}>
        <Stack alignItems="center" sx={{ pt: 1 }}>
          <Avatar
            size="lg"
            src={eurekaVariant.image_url!}
            alt={eurekaVariant.slug || 'Eureka Variant'}
          >
            <Category />
          </Avatar>
        </Stack>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ py: 0.75, px: 1.25, mb: !isLoggedIn ? 0.5 : 0, mt: -2 }}
        >
          <Typography variant="caption" color="textSecondary">
            {eurekaVariant.category} • {eurekaVariant.color}
          </Typography>
        </Stack>
        {isLoggedIn && (
          <LinearProgress
            variant="determinate"
            value={eurekaVariant.obtained ? 100 : 0}
            color="inherit"
          />
        )}
        <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
          {isLoggedIn && (
            <IconButton
              onClick={() =>
                handleObtained(
                  eurekaVariant.eureka_set!,
                  eurekaVariant.category!,
                  eurekaVariant.color!
                )
              }
              disabled={!isLoggedIn}
            >
              {eurekaVariant.obtained ? <TaskAlt /> : <RadioButtonUncheckedOutlined />}
            </IconButton>
          )}
        </Box>
      </Box>
    </Card>
  )
}
