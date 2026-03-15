import { countObtained, percent } from '@/hooks/count-obtained'
import { Color, EurekaSet } from '@/lib/types/eureka'
import { Avatar, Box, Card, LinearProgress, Stack, Typography } from '@mui/material'
import { Category } from '@mui/icons-material'

export default function EurekaColorSetCard({
  eurekaSet,
  color,
  isLoggedIn,
}: {
  eurekaSet: EurekaSet
  color: Color
  isLoggedIn: boolean
}) {
  const slug = `${eurekaSet.slug}-${color.slug}`
  const variants = eurekaSet.eureka_variants.filter((variant) => variant.color === color.slug)

  const obtainedCount = countObtained(variants)
  const percentage = percent(obtainedCount.obtained, obtainedCount.total)

  return (
    <Card
      data-active={percentage === 100 ? '' : undefined}
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
      <Box sx={{ position: 'relative' }}>
        <Stack alignItems="center" sx={{ pt: 1 }}>
          <Avatar
            alt={slug}
						color='transparent'
            size="lg"
            src={variants[0].image_url!}
            sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
          >
            <Category fontSize="inherit" />
          </Avatar>
        </Stack>
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
          sx={{ px: 1.25, mb: !isLoggedIn ? 0.5 : 0, mt: -2 }}
        >
          <Typography variant="overline">{color.title}</Typography>
          {isLoggedIn && (
            <Typography color="textSecondary" variant="caption">
              {`${percentage}%`}
            </Typography>
          )}
        </Stack>
        {isLoggedIn && <LinearProgress color="inherit" value={percentage} variant="determinate" />}
      </Box>
    </Card>
  )
}
