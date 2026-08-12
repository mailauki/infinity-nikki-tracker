import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Box, Chip, Divider, Skeleton, Stack, Typography } from '@mui/material'
import { getFeedbackById, getFeedbackImageUrls } from '@/hooks/data/admin/feedback'

export const metadata = { title: 'Feedback detail' }

type Props = { params: Promise<{ id: string }> }

export default function FeedbackDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<Skeleton height={400} variant="rounded" />}>
      <FeedbackDetail params={params} />
    </Suspense>
  )
}

async function FeedbackDetail({ params }: Props) {
  const { id } = await params
  const [row, imageUrls] = await Promise.all([getFeedbackById(id), getFeedbackImageUrls(id)])

  if (!row) notFound()

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Chip label={row.type} size="small" />
        <Chip label={row.category} size="small" />
        <Chip color="info" label={row.status} size="small" />
      </Stack>

      <Typography variant="h5">{row.title}</Typography>
      <Typography color="text.secondary" variant="caption">
        {new Date(row.created_at).toLocaleString()}
        {row.email ? ` · ${row.email}` : ' · no contact address'}
      </Typography>

      <Divider />

      <Typography sx={{ whiteSpace: 'pre-wrap' }}>{row.description}</Typography>

      {(row.page_path || row.entity_slug) && (
        <Box>
          <Typography color="text.secondary" variant="overline">
            Context
          </Typography>
          <Typography variant="body2">
            {row.entity_title ?? row.entity_slug ?? '—'}
            {row.page_path ? ` (${row.page_path})` : ''}
          </Typography>
        </Box>
      )}

      {row.user_agent && (
        <Box>
          <Typography color="text.secondary" variant="overline">
            User agent
          </Typography>
          <Typography sx={{ wordBreak: 'break-all' }} variant="caption">
            {row.user_agent}
          </Typography>
        </Box>
      )}

      {imageUrls.length > 0 && (
        <Box>
          <Typography color="text.secondary" variant="overline">
            Screenshots
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {imageUrls.map((url) => (
              // Signed URLs expire, so these are deliberately not optimized or
              // cached by next/image.
              <Box
                key={url}
                alt=""
                component="img"
                src={url}
                sx={{ maxWidth: 320, borderRadius: 1 }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Stack>
  )
}
