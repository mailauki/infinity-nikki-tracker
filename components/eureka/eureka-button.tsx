import { handleObtained } from '@/app/(main)/eureka/actions'
import { Eureka } from '@/lib/types/types'
import { Card, CardActionArea, CardContent, Chip, Typography } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'

import EurekaSetImage from './eureka-set-image'

export default function EurekaButton({
  eureka,
  isLoggedIn,
}: {
  eureka: Eureka
  isLoggedIn: boolean
}) {
  const slugEurekaSet = eureka.eureka_set!.replace(' ', '_')
  const slug = `${slugEurekaSet}-${eureka.category}-${eureka.color}`

  return (
    <Card key={eureka.id}>
      <CardActionArea
        onClick={() => handleObtained(slug)}
        disabled={!isLoggedIn}
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
        <EurekaSetImage
          imageUrl={eureka.image_url!}
          alt={slug}
          action={eureka.obtained === true && <Chip size="small" label={<CheckIcon />} />}
        />
        <CardContent>
          <Typography variant="subtitle2">{eureka.eureka_set}</Typography>
          <Typography variant="caption" color="textSecondary">
            {`${eureka.category} • ${eureka.color}`}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
