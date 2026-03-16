import { CardHeader, Typography } from '@mui/material'
import { CardSize } from '@/lib/types/props'
import { Category } from '@mui/icons-material'
import LazyAvatar from './lazy-avatar'

export default function EurekaSetImage({
  imageUrl,
  alt,
  action,
  size,
  title,
  subheader,
}: {
  imageUrl: string
  alt: string
  action?: React.ReactNode
  size?: CardSize
  title?: string
  subheader?: string
}) {
  if (size !== 'sm') {
    return (
      <CardHeader
        action={action}
        avatar={
          <LazyAvatar alt={alt} color="transparent" size="lg" src={imageUrl}>
            <Category fontSize="inherit" />
          </LazyAvatar>
        }
        sx={{ width: '100%' }}
      />
    )
  }

  return (
    <CardHeader
      disableTypography
      action={action}
      avatar={
        <LazyAvatar alt={alt} color="transparent" size="md" src={imageUrl}>
          <Category fontSize="inherit" />
        </LazyAvatar>
      }
      subheader={<Typography variant="body2">{subheader}</Typography>}
      sx={{ width: '100%' }}
      title={<Typography variant={subheader ? 'overline' : 'subtitle1'}>{title}</Typography>}
    />
  )
}
