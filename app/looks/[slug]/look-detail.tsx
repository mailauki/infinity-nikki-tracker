'use client'

import { Box, Container, Stack, Typography } from '@mui/material'
import LazyImage from '@/components/lazy-image'
import PageShell from '@/components/page-shell'
import type { CustomLook } from '@/lib/types/looks'
import SlugToolBar from '@/components/navbar/slug-toolbar'

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
            image={p.image_url ?? undefined}
            kind="media"
            sx={{ width: 94, aspectRatio: '1 / 1', bgcolor: 'surface.containerHighest' }}
            title={p.slug}
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
      <SlugToolBar isAdmin={false} />
      {/* Add user match to this slug in place of isAdmin for edit button */}

      <PageShell maxWidth="md">
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
      </PageShell>
    </>
  )
}
