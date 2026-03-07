import { Avatar, CardHeader } from '@mui/material'
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
					<Avatar
					src={imageUrl}
					alt={alt}
					sx={{ bgcolor: imageUrl && 'transparent' }}
					size="lg"
					>
						<Category fontSize='inherit' />
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
					<Avatar
					src={imageUrl}
					alt={alt}
					sx={{ bgcolor: imageUrl && 'transparent' }}
					size='md'
					>
						<Category fontSize='inherit' />
					</Avatar>
      }
      title={title}
      subheader={subheader}
      action={action}
      sx={{ width: '100%' }}
    />
  )
}
