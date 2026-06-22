'use client'

import Link from 'next/link'
import { Box, Container, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { ChevronLeft, Edit as EditIcon } from '@mui/icons-material'
import NavBarToolbar from '@/components/navbar/navbar-toolbar'
import LazyImage from '@/components/lazy-image'
import type { CustomLook } from '@/lib/types/looks'

type Piece = { slug: string; image_url: string | null }

function PieceRow({ label, pieces }: { label: string; pieces: Piece[] }) {
  if (pieces.length === 0) return null
  return (
    <Stack spacing={0.75}>
      <Typography color="textSecondary" variant="caption">
        {label}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {pieces.map((p) => (
          <LazyImage
            key={p.slug}
            alt={p.slug}
            kind="square"
            size="lg"
            src={p.image_url ?? undefined}
            sx={{ bgcolor: 'surface.containerHighest' }}
          />
        ))}
      </Box>
    </Stack>
  )
}

export default function LookDetail({
  look,
  href,
  pieces,
  accessories,
  eureka,
}: {
  look: Pick<CustomLook, 'name' | 'description' | 'image_url' | 'slug' | 'id'>
  href: string
  pieces: Piece[]
  accessories: Piece[]
  eureka: Piece[]
}) {
  const total = pieces.length + accessories.length + eureka.length

  return (
    <>
      <NavBarToolbar>
        <Stack
          direction="row"
          sx={{ flex: 1, alignItems: 'center', justifyContent: 'space-between' }}
        >
          <IconButton component={Link} href="/looks">
            <ChevronLeft />
          </IconButton>
          <Tooltip title="Edit">
            <IconButton component={Link} href={`/looks/edit/${href}`}>
              <EditIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </NavBarToolbar>

      <Stack useFlexGap direction="row" spacing={3} sx={{ flexWrap: 'wrap' }}>
        <Container disableGutters fixed maxWidth="xs">
          <Stack spacing={2}>
            {look.image_url && (
              <LazyImage
                image={look.image_url}
                kind="media"
                sx={{ width: '100%', maxWidth: 260, aspectRatio: '9 / 16' }}
                title={look.name}
              />
            )}
            <Stack spacing={0.5}>
              <Typography variant="h6">{look.name}</Typography>
              {look.description && (
                <Typography color="textSecondary" variant="body2">
                  {look.description}
                </Typography>
              )}
              <Typography color="textSecondary" variant="caption">
                {total} piece{total !== 1 ? 's' : ''}
              </Typography>
            </Stack>
          </Stack>
        </Container>

        <Stack spacing={2} sx={{ flex: 1, minWidth: 240 }}>
          <PieceRow label="Pieces" pieces={pieces} />
          <PieceRow label="Accessories" pieces={accessories} />
          <PieceRow label="Eureka" pieces={eureka} />
          {total === 0 && (
            <Typography color="textSecondary" variant="body2">
              This look has no pieces yet.
            </Typography>
          )}
        </Stack>
      </Stack>
    </>
  )
}
