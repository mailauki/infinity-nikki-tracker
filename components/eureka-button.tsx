import Image from 'next/image'

import { handleObtained } from '@/app/(main)/eureka/actions'
import { Eureka } from '@/lib/types/types'
import { Box, Card, CardActionArea, CardHeader, CardMedia } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'

export default function EurekaButton({ eureka, user }: { eureka: Eureka; user: boolean }) {
  const slugEurekaSet = eureka.eureka_set!.replace(' ', '_')
  const slug = `${slugEurekaSet}-${eureka.category}-${eureka.color}`

  return (
    <Card key={eureka.id}>
      <CardActionArea
        onClick={() => handleObtained(slug)}
        disabled={!user}
        data-active={eureka.obtained === true ? '' : undefined}
        sx={{
          height: '100%',
          '&[data-active]': {
            backgroundColor: 'action.selected',
            '&:hover': {
              backgroundColor: 'action.selectedHover',
            },
          },
        }}
      >
        <CardMedia sx={{ p: 1 }}>
          <Image src={eureka.image_url!} alt={slug} width={100} height={100} />
        </CardMedia>
        <CardHeader title={eureka.eureka_set} subheader={`${eureka.category} • ${eureka.color}`} />
        <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
          {eureka.obtained === true && <CheckIcon />}
        </Box>
      </CardActionArea>
    </Card>
  )
}
