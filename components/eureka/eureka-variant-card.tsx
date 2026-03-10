import { EurekaVariant } from '@/lib/types/eureka'
import { Avatar, Box, Chip, LinearProgress, Stack, Typography } from '@mui/material'
import { Category, Check } from '@mui/icons-material'

export default function EurekaVariantCard({
  eurekaVariant,
  isLoggedIn,
}: {
  eurekaVariant: EurekaVariant
  isLoggedIn: boolean
}) {
  return (
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
          color={eurekaVariant.obtained ? 'primary' : 'inherit'}
        />
      )}
      <Box sx={{ position: 'absolute', top: 6, right: 6 }}>
        {isLoggedIn && eurekaVariant.obtained && <Chip size="small" label={<Check />} />}
      </Box>
    </Box>
  )
}
