'use client'
import { ButtonBase } from '@mui/material'
import AvatarPreview from './avatar-preview'

export default function AvatarUpload({
  url,
  uploading,
  inputRef,
}: {
  url: string | null
  uploading: boolean
  inputRef: React.RefObject<HTMLInputElement | null>
}) {
  return (
    <ButtonBase
      aria-label="Upload avatar image"
      disabled={uploading}
      sx={{
        borderRadius: '100px',
        '&:focus-visible': {
          outline: '2px solid',
          outlineOffset: '2px',
        },
      }}
      onClick={() => inputRef.current?.click()}
    >
      <AvatarPreview size="xl" url={url} />
    </ButtonBase>
  )
}
