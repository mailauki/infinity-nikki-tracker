import { EurekaSet } from '@/lib/types/types'

import {
  Avatar,
  CardActionArea,
  CardContent,
  CardHeader,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import QualityStars from './quality-stars'
import { count, percent } from '@/hooks/count'
import ProgressBadge from './progress-chip'
import Image from 'next/image'

export default function EurekaItem({
  eurekaSet,
  isLoggedIn,
}: {
  eurekaSet: EurekaSet
  isLoggedIn: boolean
}) {
  const obtainedCount = count(eurekaSet.eureka)
  const percentage = percent(obtainedCount.obtained, obtainedCount.total)

  return (
    <CardActionArea href={`/eureka/${eurekaSet.slug}`}>
      <CardHeader
        title={eurekaSet.name}
        subheader={<QualityStars quality={eurekaSet.quality!} />}
        avatar={
          <Avatar>
            <Image src={eurekaSet.image_url!} alt={eurekaSet.name} width={100} height={100} />
          </Avatar>
        }
        action={<Chip label={eurekaSet.labels} variant="outlined" size="small" />}
        sx={{ pb: 0.5 }}
      />
      {isLoggedIn && (
        <CardContent component={Stack} spacing={1} sx={{ pt: 0 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" component="p">
              {percentage}%
            </Typography>
            <ProgressBadge percentage={percentage} size="small" />
          </Stack>
          <LinearProgress value={percentage} variant="determinate" color="inherit" />
        </CardContent>
      )}
    </CardActionArea>
  )
}
