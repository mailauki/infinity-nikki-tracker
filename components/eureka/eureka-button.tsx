import { handleObtained } from '@/app/(main)/eureka/actions'
import { EurekaVariant } from '@/lib/types/eureka'
import { Card, CardActionArea, Chip } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'

import EurekaSetImage from './eureka-set-image'
import EurekaCardContent from './eureka-card-content'
import { CardSize } from '@/lib/types/props'

export default function EurekaButton({
  eurekaVariant,
  isLoggedIn,
  size = 'md',
}: {
  eurekaVariant: EurekaVariant
  isLoggedIn: boolean
  size?: CardSize
}) {
  return (
    <Card>
      <CardActionArea
        data-active={eurekaVariant.obtained === true ? '' : undefined}
        disabled={!isLoggedIn}
        sx={{
          height: '100%',
          '&[data-active]': {
            backgroundColor: 'action.selected',
            '&:hover': {
              backgroundColor: 'action.selectedHover',
            },
          },
        }}
        onClick={() =>
          handleObtained(eurekaVariant.eureka_set!, eurekaVariant.category!, eurekaVariant.color!)
        }
      >
        <EurekaSetImage
          action={eurekaVariant.obtained === true && <Chip label={<CheckIcon />} size="small" />}
          alt={eurekaVariant.slug ?? ''}
          imageUrl={eurekaVariant.image_url!}
          size={size}
          subheader={`${eurekaVariant.category} • ${eurekaVariant.color}`}
          title={eurekaVariant.eureka_set!}
        />
        {size !== 'sm' && (
          <EurekaCardContent
            size={size}
            subheader={`${eurekaVariant.category} • ${eurekaVariant.color}`}
            title={eurekaVariant.eureka_set!}
          />
        )}
      </CardActionArea>
    </Card>
  )
}
