import { Typography } from '@mui/material'
import { formatRelease, type Release } from '@/hooks/release'

export default function ReleaseLine({ release }: { release: Release }) {
  const text = formatRelease(release)
  if (!text) return null
  return (
    <Typography color="text.secondary" size="small" variant="body">
      Released {text}
    </Typography>
  )
}
