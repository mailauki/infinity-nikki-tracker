import Image from 'next/image'

import { count, percent } from '@/hooks/count'
import { EurekaSet } from '@/lib/types/types'

import ProgressBadge from './progress-badge'
import QualityStars from './quality-stars'
import { Progress } from './ui/progress'
import { Box, CardContent, CardHeader, CardMedia, Chip, Stack, Typography } from '@mui/material'

export default function EurekaHeader({
  eurekaSet,
  variant = 'default',
  user,
}: {
  eurekaSet: EurekaSet
  variant?: 'default' | 'large'
  user: boolean
}) {
  const obtainedCount = count(eurekaSet.eureka)
  const percentage = percent(obtainedCount.obtained, obtainedCount.total)

  return (
    <>
      <CardMedia sx={{ p: 1 }}>
        {eurekaSet.image_url && (
          <Image src={eurekaSet.image_url} alt={eurekaSet.name} width={100} height={100} />
        )}
      </CardMedia>
      {variant === 'large' ? (
        <CardHeader
          title={
            <Stack direction="row" justifyContent="space-between">
              {eurekaSet.name}
              <QualityStars quality={eurekaSet.quality!} />
            </Stack>
          }
          subheader={
            <Stack direction="row" justifyContent="space-between">
              <span>{eurekaSet.trial}</span>
              <span>{eurekaSet.style}</span>
            </Stack>
          }
        />
      ) : (
        <CardHeader
          title={eurekaSet.name}
          subheader={<QualityStars quality={eurekaSet.quality!} />}
        />
      )}
      {user && (
        <CardContent component={Stack} spacing={1} sx={{ pt: 0 }}>
          <Stack direction="row" justifyContent="space-between">
            <ProgressBadge percentage={percentage} />
            <Typography variant="h5" component="p">
              {percentage}%
            </Typography>
          </Stack>
          <Progress value={percentage} className="bg-muted" />
        </CardContent>
      )}
      <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
        <Chip label={eurekaSet.labels} variant="outlined" size="small" />
      </Box>
    </>
  )
}