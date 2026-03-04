import Image from 'next/image'
import { Avatar, CardHeader } from '@mui/material'
import { AvatarSize } from '@/lib/types/types'

export default function CategoryImage({
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
  size?: AvatarSize
  title?: string
  subheader?: string
}) {
  return (
    <CardHeader
      avatar={
        <Avatar sx={{ bgcolor: 'transparent' }} size={size}>
          <Image src={imageUrl} alt={alt} width={100} height={100} />
        </Avatar>
      }
      title={title}
      subheader={subheader}
      action={action}
      sx={{ width: '100%' }}
    />
  )
}
