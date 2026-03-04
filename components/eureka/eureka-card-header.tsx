import { countObtained, percent } from '@/hooks/count'
import { EurekaSet } from '@/lib/types/types'
import {
  Avatar,
  Card,
  CardContent,
  CardHeader,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'

import QualityStars from '../quality-stars'
import { Category } from '@mui/icons-material'
import ProgressChip from '../progress-chip'

export default function EurekaCardHeader({
  eurekaSet,
  isLoggedIn,
  size = 'sm',
}: {
  eurekaSet: EurekaSet
  isLoggedIn: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const { name, quality, labels, style, trial } = eurekaSet
  const obtainedCount = countObtained(eurekaSet.eureka_variants)
  const percentage = percent(obtainedCount.obtained, obtainedCount.total)

  return (
    <>
      {/* <EurekaSetImage
        imageUrl={eurekaSet.image_url!}
        alt={eurekaSet.name}
        action={<Chip label={eurekaSet.labels} variant="outlined" size="small" />}
      />
      <EurekaCardContent name={eurekaSet.name} quality={eurekaSet.quality} />
      {isLoggedIn && <EurekaCardProgress percentage={percentage} />} */}
      {/* <CustomCard
			image={eurekaSet.image_url}
			title={eurekaSet.name}
			quality={eurekaSet.quality!}
			chip={eurekaSet.labels!}
			percentage={percentage}
			size='lg'
			/> */}
      <Card>
        <CardHeader
          disableTypography
          avatar={
            <Avatar alt={name} sx={{ bgcolor: 'transparent', color: 'inherit' }} size={size}>
              <Category />
            </Avatar>
          }
          title={size === 'sm' && <Typography variant="subtitle1">{name}</Typography>}
          subheader={
            size === 'sm' && (
              <Typography variant="caption" color="textSecondary">
                {quality ? <QualityStars quality={quality} /> : trial}
              </Typography>
            )
          }
          action={<Chip label={labels} variant="outlined" size="small" />}
        />
        {/* {size === 'md' && (
				<CardMedia component="img" height="100" image={image_url} alt={name} />
			)} */}
        {size !== 'sm' && (
          <CardContent sx={{ pt: 0 }}>
            {size === 'lg' ? (
              <Stack spacing={0.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h5" component="p">
                    {name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    <QualityStars quality={quality!} />
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2">{trial}</Typography>
                  <Typography variant="caption">{style}</Typography>
                </Stack>
              </Stack>
            ) : (
              <Stack spacing={0.5}>
                <Typography variant="subtitle2">{name}</Typography>
                <Typography variant="caption" color="textSecondary">
                  <QualityStars quality={quality!} />
                </Typography>
              </Stack>
            )}
          </CardContent>
        )}
        {isLoggedIn && (
          <CardContent component={Stack} spacing={1} sx={{ pt: 0 }}>
            {size !== 'sm' && (
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6" component="p">
                  {percentage}%
                </Typography>
                <ProgressChip percentage={percentage} size={size} />
              </Stack>
            )}
            <LinearProgress value={percentage} variant="determinate" color="inherit" />
          </CardContent>
        )}
      </Card>
    </>
  )
}
