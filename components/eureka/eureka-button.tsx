import { handleObtained } from '@/app/(main)/eureka/actions'
import { EurekaVariant } from '@/lib/types/types'
import { Card, CardActionArea, CardContent, Chip, Typography } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'

import EurekaSetImage from './eureka-set-image'

export default function EurekaButton({
  eurekaVariant,
  isLoggedIn,
}: {
  eurekaVariant: EurekaVariant
  isLoggedIn: boolean
}) {
  const slugEurekaSet = eurekaVariant.eureka_set!.replace(' ', '_')
  const slug = `${slugEurekaSet}-${eurekaVariant.category}-${eurekaVariant.color}`

  return (
    <Card key={eurekaVariant.id}>
      <CardActionArea
        onClick={() => handleObtained(slug)}
        disabled={!isLoggedIn}
        data-active={eurekaVariant.obtained === true ? '' : undefined}
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
          imageUrl={eurekaVariant.image_url!}
          alt={slug}
          action={eurekaVariant.obtained === true && <Chip size="small" label={<CheckIcon />} />}
        />
        <CardContent>
          <Typography variant="subtitle2">{eurekaVariant.eureka_set}</Typography>
          <Typography variant="caption" color="textSecondary">
            {`${eurekaVariant.category} • ${eurekaVariant.color}`}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
