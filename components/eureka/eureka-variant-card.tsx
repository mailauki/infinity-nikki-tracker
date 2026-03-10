import { EurekaVariant } from '@/lib/types/eureka'
import { Avatar, Box, Chip, LinearProgress, Stack, Typography } from '@mui/material'
import { Category, Check } from '@mui/icons-material'

export default function EurekaVariantCard({ eurekaVariant }: { eurekaVariant: EurekaVariant }) {
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
        sx={{ py: 0.75, px: 1.25, mt: -2 }}
      >
        <Typography variant="caption" color="textSecondary">
          {eurekaVariant.category} • {eurekaVariant.color}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={eurekaVariant ? 100 : 0}
        color={eurekaVariant ? 'primary' : 'inherit'}
      />
      <Box sx={{ position: 'absolute', top: 6, right: 6 }}>
        <Chip size="small" label={<Check />} />
      </Box>
    </Box>
  )
}
