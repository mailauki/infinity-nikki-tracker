import { Avatar, CardHeader, Typography } from '@mui/material'
import { CardSize } from '@/lib/types/props'
import { Category } from '@mui/icons-material'

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
          <Avatar alt={alt} color='transparent' size="lg" src={imageUrl}>
            <Category fontSize="inherit" />
          </Avatar>
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
        <Avatar alt={alt} color='transparent' size="md" src={imageUrl}>
          <Category fontSize="inherit" />
        </Avatar>
      }
      subheader={<Typography variant="body2">{subheader}</Typography>}
      sx={{ width: '100%' }}
      title={<Typography variant={subheader ? 'overline' : 'subtitle1'}>{title}</Typography>}
    />
  )
}
