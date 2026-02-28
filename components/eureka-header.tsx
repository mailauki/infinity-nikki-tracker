import Image from 'next/image'

import { count, percent } from '@/hooks/count'
import { EurekaSet } from '@/lib/types/types'

import ProgressBadge from './progress-chip'
import QualityStars from './quality-stars'
import {
  Avatar,
  Box,
  CardContent,
  CardHeader,
  CardMedia,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'

export default function EurekaHeader({
  eurekaSet,
  variant = 'default',
  isLoggedIn,
}: {
  eurekaSet: EurekaSet
  variant?: 'default' | 'large'
  isLoggedIn: boolean
}) {
  const obtainedCount = count(eurekaSet.eureka)
  const percentage = percent(obtainedCount.obtained, obtainedCount.total)

  return (
    <>
      {variant === 'large' ? (
        <>
          <CardMedia>
            <Image src={eurekaSet.image_url!} alt={eurekaSet.name} width={100} height={100} />
          </CardMedia>
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
            sx={{ pb: 0.5 }}
          />
          <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
            <Chip label={eurekaSet.labels} variant="outlined" size="small" />
          </Box>
        </>
      ) : (
        <CardHeader
          title={eurekaSet.name}
          subheader={<QualityStars quality={eurekaSet.quality!} />}
          avatar={
            <Avatar sx={{ bgcolor: "transparent" }}>
              <Image src={eurekaSet.image_url!} alt={eurekaSet.name} width={100} height={100} />
            </Avatar>
          }
          action={<Chip label={eurekaSet.labels} variant="outlined" size="small" />}
          sx={{ pb: 0.5 }}
        />
      )}
      {isLoggedIn && (
        <CardContent component={Stack} spacing={1} sx={{ pt: 0 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" component="p">
              {percentage}%
            </Typography>
            <ProgressBadge
              percentage={percentage}
              size={variant === 'large' ? 'medium' : 'small'}
            />
          </Stack>
          <LinearProgress value={percentage} variant="determinate" color="inherit" />
        </CardContent>
      )}
    </>
  )
}
