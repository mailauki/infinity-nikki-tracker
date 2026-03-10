import { countObtained, percent } from '@/hooks/count-obtained'
import { Color, EurekaSet } from '@/lib/types/eureka'
import { Avatar, Box, LinearProgress, Stack, Typography } from '@mui/material'
import { Category } from '@mui/icons-material'

export default function EurekaColorSetCard({
  eurekaSet,
  color,
}: {
  eurekaSet: EurekaSet
  color: Color
}) {
  const slug = `${eurekaSet.slug}-${color.title.toLowerCase()}`
  const variants = eurekaSet.eureka_variants.filter((variant) => variant.color === color.title)

  const obtainedCount = countObtained(variants)
  const percentage = percent(obtainedCount.obtained, obtainedCount.total)

  return (
    <Box sx={{ position: 'relative' }}>
      <Stack alignItems="center" sx={{ pt: 1 }}>
        <Avatar size="lg" src={variants[0].image_url!} alt={slug}>
          <Category />
        </Avatar>
      </Stack>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 1.25, mt: -2 }}
      >
        <Typography variant="overline">{color.title}</Typography>
        <Typography variant="caption" color="textSecondary">
          {`${percentage}%`}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={percentage}
        color={percentage === 100 ? 'primary' : 'inherit'}
      />
      {/* <Box sx={{ position: 'absolute', top: 6, right: 6 }}>
				<Chip size="small" label={`${percentage}%`} />
			</Box> */}
    </Box>
  )
}
