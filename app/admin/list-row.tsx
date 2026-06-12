import { Edit, Category } from '@mui/icons-material'
import {
  ListItem,
  Tooltip,
  IconButton,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@mui/material'
import LazyImage from '@/components/lazy-image'
import { formatDate } from '@/lib/utils'

export default function ListRow({
  list,
  title,
  subheader,
  slug,
  image_url,
  updated_at,
}: {
  list?: string
  title: string
  subheader?: string
  slug?: string
  image_url?: string
  updated_at?: string | null
}) {
  const backUrl = list ? `/${list}` : undefined
  const editHref = `/${list}/edit/${slug}${backUrl ? `?back=${encodeURIComponent(backUrl)}` : ''}`

  return (
    <ListItem
      secondaryAction={
        <Tooltip title={`Edit ${title}`}>
          <IconButton color="secondary" href={editHref}>
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
      }
    >
      <ListItemAvatar>
        <LazyImage
          alt={slug}
          src={image_url}
          sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
        >
          <Category fontSize="inherit" />
        </LazyImage>
      </ListItemAvatar>
      <ListItemText primary={title} secondary={subheader} />
      <ListItemText
        disableTypography
        secondary={
          <Typography variant="caption">{updated_at ? formatDate(updated_at) : '—'}</Typography>
        }
        sx={{ textAlign: 'right', mr: 2 }}
      />
    </ListItem>
  )
}
