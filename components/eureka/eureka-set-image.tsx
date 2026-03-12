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
          <Avatar alt={alt} size="lg" src={imageUrl} sx={{ bgcolor: imageUrl && 'transparent' }}>
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
        <Avatar alt={alt} size="md" src={imageUrl} sx={{ bgcolor: imageUrl && 'transparent' }}>
          <Category fontSize="inherit" />
        </Avatar>
      }
      subheader={<Typography variant="body2">{subheader}</Typography>}
      sx={{ width: '100%' }}
      title={<Typography variant={subheader ? 'overline' : 'subtitle1'}>{title}</Typography>}
    />
  )
}
