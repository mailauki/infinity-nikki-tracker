'use client'
import { ButtonBase } from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import LazyImage from '@/components/lazy-image'

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
      <LazyImage alt="Avatar" size="xl" src={url} variant="circular">
        <PersonIcon fontSize="inherit" />
      </LazyImage>
    </ButtonBase>
  )
}
