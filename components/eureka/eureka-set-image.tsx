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
        avatar={
          <Avatar src={imageUrl} alt={alt} sx={{ bgcolor: imageUrl && 'transparent' }} size="lg">
            <Category fontSize="inherit" />
          </Avatar>
        }
        action={action}
        sx={{ width: '100%' }}
      />
    )
  }

  return (
    <CardHeader
      avatar={
        <Avatar src={imageUrl} alt={alt} sx={{ bgcolor: imageUrl && 'transparent' }} size="md">
          <Category fontSize="inherit" />
        </Avatar>
      }
      disableTypography
      title={<Typography variant={subheader ? 'overline' : 'subtitle1'}>{title}</Typography>}
      subheader={<Typography variant="body2">{subheader}</Typography>}
      action={action}
      sx={{ width: '100%' }}
    />
  )
}
