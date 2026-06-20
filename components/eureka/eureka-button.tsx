'use client'

import { toTitle } from '@/lib/utils'
import { handleObtained } from '@/app/eureka/actions'
import { EurekaVariant } from '@/lib/types/eureka'
import { Card, CardActionArea, Chip } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import { useTransition } from 'react'
import { enqueueSnackbar } from 'notistack'

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
  const [isPending, startTransition] = useTransition()
  const obtained = eurekaVariant.obtained === true
  const setTitle = toTitle(eurekaVariant.eureka_set ?? '')
  const category = toTitle(eurekaVariant.category ?? '')
  const color = toTitle(eurekaVariant.color ?? '')
  const label = `${setTitle} – ${category} ${color}${obtained ? ', obtained' : ''}`

  return (
    <Card>
      <CardActionArea
        aria-busy={isPending || undefined}
        aria-disabled={!isLoggedIn || isPending || undefined}
        aria-label={label}
        aria-pressed={obtained}
        data-active={obtained ? '' : undefined}
        sx={{
          height: '100%',
          '&[data-active]': {
            backgroundColor: 'action.selected',
            '&:hover': {
              backgroundColor: 'action.selectedHover',
            },
          },
        }}
        onClick={() => {
          if (!isLoggedIn || isPending) return
          startTransition(async () => {
            try {
              await handleObtained(
                eurekaVariant.eureka_set!,
                eurekaVariant.category!,
                eurekaVariant.color!
              )
            } catch (err) {
              console.error('Failed to toggle obtained eureka:', err)
              enqueueSnackbar('Failed to update your collection. Please try again.', {
                variant: 'error',
              })
            }
          })
        }}
      >
        <EurekaSetImage
          action={obtained && <Chip aria-hidden="true" label={<CheckIcon />} size="small" />}
          alt={`${setTitle} – ${category} in ${color}`}
          imageUrl={eurekaVariant.image_url!}
          size={size}
          subheader={`${category} • ${color}`}
          title={setTitle}
        />
        {size !== 'sm' && (
          <EurekaCardContent size={size} subheader={`${category} • ${color}`} title={setTitle} />
        )}
      </CardActionArea>
    </Card>
  )
}
