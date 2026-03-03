import Image from 'next/image'
import { Avatar, CardHeader } from '@mui/material'

export default function EurekaSetImage({
  imageUrl,
  alt,
  action,
}: {
  imageUrl: string
  alt: string
  action?: React.ReactNode
}) {
  return (
    <CardHeader
      avatar={
        <Avatar sx={{ bgcolor: 'transparent' }} size="lg">
          <Image src={imageUrl} alt={alt} width={100} height={100} />
        </Avatar>
      }
      action={action}
    />
  )
}
