import { Edit, Category } from '@mui/icons-material'
import {
  ListItem,
  Tooltip,
  IconButton,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@mui/material'
import LazyAvatar from '@/components/lazy-avatar'
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
  const editHref = `/${list}/edit/${slug}`

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
        <LazyAvatar
          alt={slug}
          src={image_url}
          sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
        >
          <Category fontSize="inherit" />
        </LazyAvatar>
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
