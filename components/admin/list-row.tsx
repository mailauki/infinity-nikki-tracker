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
}: {
  list?: string
  title: string
  subheader?: string
  slug?: string
  image_url?: string
  updated_at?: string | null
}) {
  return (
    <ListItem
      secondaryAction={
        <Tooltip title={`Edit ${title}`}>
          <IconButton color="secondary" href={`/${list}/edit/${slug}`}>
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
      }
    >
      <ListItemAvatar>
        <Avatar src={image_url} alt={slug}>
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
