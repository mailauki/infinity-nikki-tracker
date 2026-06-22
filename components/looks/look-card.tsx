'use client'

import { useState } from 'react'
import {
  Avatar,
  AvatarGroup,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import DiamondOutlinedIcon from '@mui/icons-material/DiamondOutlined'
import CheckroomIcon from '@mui/icons-material/Checkroom'
import WatchOutlinedIcon from '@mui/icons-material/WatchOutlined'
import { enqueueSnackbar } from 'notistack'
import type { CustomLook } from '@/lib/types/looks'

export type LookCounts = { pieces: number; accessories: number; eureka: number }

export default function LookCard({
  look,
  thumbnails,
  counts,
  onDelete,
}: {
  look: CustomLook
  thumbnails: string[]
  counts: LookCounts
  onDelete: (id: string) => Promise<{ error?: string }>
}) {
  const [deleting, setDeleting] = useState(false)
  const slug = look.slug ?? look.id
  const href = `/looks/${slug}`
  const editHref = `/looks/edit/${slug}`
  const totalItems = look.eureka_variant_slugs.length + look.outfit_variant_slugs.length
  const date = new Date(look.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    setDeleting(true)
    const result = await onDelete(look.id)
    if (result?.error) {
      setDeleting(false)
      enqueueSnackbar('Failed to delete this look. Please try again.', { variant: 'error' })
    }
  }

  return (
    <Card
      sx={{
        opacity: deleting ? 0.5 : 1,
        transition: 'opacity 0.2s',
        display: 'flex',
        flexDirection: 'column',
      }}
      variant="outlined"
    >
      <CardActionArea href={href} sx={{ flex: 1 }}>
        <CardContent>
          <Stack spacing={1.5}>
            {thumbnails.length > 0 && (
              <AvatarGroup
                max={6}
                spacing={8}
                sx={{
                  justifyContent: 'flex-start',
                  '& .MuiAvatar-root': {
                    width: 40,
                    height: 40,
                    border: '2px solid',
                    borderColor: 'surface.containerLow',
                  },
                }}
              >
                {thumbnails.map((url, i) => (
                  <Avatar
                    key={i}
                    src={url}
                    sx={{ bgcolor: 'surface.containerHighest' }}
                    variant="rounded"
                  />
                ))}
              </AvatarGroup>
            )}

            <Stack spacing={0.25}>
              <Typography component="span" sx={{ fontWeight: 500 }} variant="subtitle1">
                {look.name}
              </Typography>
              {look.description && (
                <Typography
                  color="textSecondary"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                  variant="caption"
                >
                  {look.description}
                </Typography>
              )}
            </Stack>

            <Stack direction="row" sx={{ gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
              {counts.pieces > 0 && (
                <Chip
                  icon={<CheckroomIcon />}
                  label={`${counts.pieces} piece${counts.pieces !== 1 ? 's' : ''}`}
                  size="small"
                  variant="outlined"
                />
              )}
              {counts.accessories > 0 && (
                <Chip
                  icon={<WatchOutlinedIcon />}
                  label={`${counts.accessories} accessor${counts.accessories !== 1 ? 'ies' : 'y'}`}
                  size="small"
                  variant="outlined"
                />
              )}
              {counts.eureka > 0 && (
                <Chip
                  icon={<DiamondOutlinedIcon />}
                  label={`${counts.eureka} eureka`}
                  size="small"
                  variant="outlined"
                />
              )}
              {totalItems === 0 && <Chip label="Empty" size="small" variant="outlined" />}
            </Stack>

            <Typography color="textSecondary" variant="caption">
              {date}
            </Typography>
          </Stack>
        </CardContent>
      </CardActionArea>

      <Divider variant="middle" />

      <CardActions>
        <Stack
          direction="row"
          sx={{
            gap: 0.5,
            flexGrow: 1,
            justifyContent: 'flex-end',
          }}
        >
          <Tooltip title="Edit">
            <IconButton href={editHref} size="small">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton disabled={deleting} size="small" onClick={handleDelete}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </CardActions>
    </Card>
  )
}

export function LooksLimitBanner({ count, limit }: { count: number; limit: number }) {
  return (
    <Card
      sx={{
        border: '1px solid',
        borderColor: 'primary.main',
        borderRadius: 3,
      }}
      variant="outlined"
    >
      <CardContent>
        <Stack spacing={1}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon color="primary" fontSize="small" />
            <Typography variant="subtitle2">
              {count} / {limit} looks used
            </Typography>
          </Stack>
          <Typography color="textSecondary" variant="caption">
            Free accounts can save up to {limit} custom looks. Upgrade to create unlimited looks.
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}
