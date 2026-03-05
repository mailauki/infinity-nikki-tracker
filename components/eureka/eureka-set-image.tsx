import Image from 'next/image'
import { Avatar, CardHeader } from '@mui/material'
import { CardSize } from '@/lib/types/types'

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
          <Avatar sx={{ bgcolor: 'transparent' }} size='lg'>
            <Image src={imageUrl!} alt={alt} width={100} height={100} />
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
        <Avatar sx={{ bgcolor: 'transparent' }} size='md'>
          <Image src={imageUrl!} alt={alt} width={100} height={100} />
        </Avatar>
      }
      title={title}
      subheader={subheader}
      action={action}
      sx={{ width: '100%' }}
    />
  )
}
