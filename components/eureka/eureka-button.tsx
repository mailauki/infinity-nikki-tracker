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
  const slugEurekaSet = eurekaVariant.eureka_set!.replace(' ', '_')
  const slug = `${slugEurekaSet}-${eurekaVariant.category}-${eurekaVariant.color}`

  return (
    <Card>
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
          title={eurekaVariant.eureka_set!}
          subheader={`${eurekaVariant.category} • ${eurekaVariant.color}`}
          size={size}
        />
        {size !== 'sm' && (
          <EurekaCardContent
            title={eurekaVariant.eureka_set!}
            subheader={`${eurekaVariant.category} • ${eurekaVariant.color}`}
            size={size}
          />
        )}
      </CardActionArea>
    </Card>
  )
}
