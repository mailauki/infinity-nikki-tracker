import { Edit, Category } from '@mui/icons-material'
import {
  ListItem,
  Tooltip,
  IconButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
} from '@mui/material'

export default function ListRow({
  list,
  title,
  subheader,
  slug,
  image_url,
  updated_at,
  back,
}: {
  list?: string
  title: string
  subheader?: string
  slug?: string
  image_url?: string
  updated_at?: string | null
  back?: string
}) {
  const editHref = back
    ? `/${list}/edit/${slug}?back=${encodeURIComponent(back)}`
    : `/${list}/edit/${slug}`

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
        <Avatar alt={slug} src={image_url}>
          <Category />
        </Avatar>
      </ListItemAvatar>
      <ListItemText primary={title} secondary={subheader} />
      <ListItemText
        disableTypography
        secondary={
          <Typography variant="caption">
            {updated_at ? new Date(updated_at).toLocaleDateString() : '—'}
          </Typography>
        }
        sx={{ textAlign: 'right', mr: 2 }}
      />
    </ListItem>
  )
}
