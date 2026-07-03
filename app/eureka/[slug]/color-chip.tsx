import { EurekaColor } from '@/lib/types/eureka'
import { Chip } from '@mui/material'
import LazyImage from '@/components/lazy-image'
import { Done } from '@mui/icons-material'
import { colorIconSrc } from '@/lib/look-utils'

export default function ColorChip({
  color,
  selectedColor,
  toggleColor,
}: {
  color: EurekaColor
  selectedColor?: string
  toggleColor?: (value: string) => void
}) {
  if (toggleColor) {
    const active = selectedColor === color.slug
    return (
      <Chip
        key={color.slug}
        clickable
        avatar={
          <LazyImage alt={color.title || color.slug} size="xs" src={colorIconSrc(color.slug)} />
        }
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
      avatar={
        <LazyImage alt={color.title || color.slug} size="xs" src={colorIconSrc(color.slug)} />
      }
      color="default"
      deleteIcon={<Done />}
      label={color.title}
      sx={{ bgcolor: 'surface.container' }}
    />
  )
}
