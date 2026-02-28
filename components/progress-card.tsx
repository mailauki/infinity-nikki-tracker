import Image from 'next/image'

import { Progress } from '@/components/ui/progress'
import { count, percent } from '@/hooks/count'
import { Eureka, Total } from '@/lib/types/types'
import { Box, Card, CardActions, CardHeader, CardMedia, Chip } from '@mui/material'

export default function ProgressCard({
  item,
  imageSize = 60,
  eureka,
  isLoggedIn,
}: {
  item: Total
  imageSize?: number
  eureka: Eureka[]
  isLoggedIn: boolean
}) {
  const obtainedCount = count(eureka)
  const percentage = percent(obtainedCount.obtained, obtainedCount.total)

  return (
    <Card
      variant="outlined"
      sx={{ position: 'relative' }}
      className={`${
        item.name === 'Iridescent'
          ? 'order-last col-start-3 row-start-1 row-end-3 md:col-start-5 md:row-end-1'
          : ''
      }`}
    >
      {imageSize > 60 && (
        <CardMedia sx={{ p: 1 }}>
          <Image src={item.image_url!} alt={item.name!} width={imageSize} height={imageSize} />
        </CardMedia>
      )}
      <CardHeader
        avatar={
          imageSize <= 60 && (
            <Image src={item.image_url!} alt={item.name!} width={imageSize} height={imageSize} />
          )
        }
        title={item.name}
        subheader={`${percentage}%`}
      />
      <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
        <Chip
          label={`${obtainedCount.obtained} / ${obtainedCount.total}`}
          variant="outlined"
          size="small"
        />
      </Box>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Progress value={percentage} className="bg-muted" />
      </CardActions>
    </Card>
  )
}
