import { Color } from '@/lib/types/eureka'
import { Chip } from '@mui/material'
import LazyAvatar from './eureka/lazy-avatar'
import { Done } from '@mui/icons-material'

export default function ColorChip({
  color,
  selectedColor,
  toggleColor,
}: {
  color: Color
  selectedColor?: string
  toggleColor?: (value: string) => void
}) {
  if (toggleColor) {
    const active = selectedColor === color.slug
    return (
      <Chip
        key={color.slug}
        clickable
        avatar={<LazyAvatar alt={color.title || color.slug} size="xs" src={color.image_url!} />}
        color={active ? 'primary' : 'default'}
        deleteIcon={<Done />}
        label={color.title}
        sx={{ bgcolor: active ? 'primary' : 'surface.container' }}
        onClick={() => toggleColor(color.slug)}
        onDelete={active ? () => toggleColor(color.slug) : undefined}
      />
    )
  }
  return (
    <Chip
      key={color.slug}
      avatar={<LazyAvatar alt={color.title || color.slug} size="xs" src={color.image_url!} />}
      color="default"
      deleteIcon={<Done />}
      label={color.title}
      sx={{ bgcolor: 'surface.container' }}
    />
  )
}
