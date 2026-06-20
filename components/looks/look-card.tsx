'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Avatar,
  AvatarGroup,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DiamondOutlinedIcon from '@mui/icons-material/DiamondOutlined'
import StyleOutlinedIcon from '@mui/icons-material/StyleOutlined'
import { enqueueSnackbar } from 'notistack'
import type { CustomLook } from '@/lib/types/looks'

export default function LookCard({
  look,
  thumbnails,
  onDelete,
}: {
  look: CustomLook
  thumbnails: string[]
  onDelete: (id: string) => Promise<{ error?: string }>
}) {
  const [deleting, setDeleting] = useState(false)
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
      <CardActionArea component={Link} href={`/looks/${look.id}`} sx={{ flex: 1 }}>
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
                    borderColor: 'surface.containerLowest',
                  },
                }}
              >
                {thumbnails.map((url, i) => (
                  <Avatar key={i} src={url} variant="rounded" />
                ))}
              </AvatarGroup>
            )}

            <Stack spacing={0.25}>
              <Typography sx={{ fontWeight: 500 }} variant="subtitle2">
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
              {look.eureka_variant_slugs.length > 0 && (
                <Chip
                  icon={<DiamondOutlinedIcon />}
                  label={`${look.eureka_variant_slugs.length} eureka`}
                  size="small"
                  variant="outlined"
                />
              )}
              {look.outfit_variant_slugs.length > 0 && (
                <Chip
                  icon={<StyleOutlinedIcon />}
                  label={`${look.outfit_variant_slugs.length} outfit`}
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

      <Stack
        direction="row"
        sx={{
          px: 1,
          pb: 1,
          gap: 0.5,
          justifyContent: 'flex-end',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Tooltip title="Edit">
          <IconButton component={Link} href={`/looks/${look.id}`} size="small">
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton disabled={deleting} size="small" onClick={handleDelete}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
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
