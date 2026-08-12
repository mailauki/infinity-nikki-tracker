import { Suspense } from 'react'
import { Skeleton, Stack, Typography } from '@mui/material'
import FeedbackView from './feedback-view'
import { getFeedback } from '@/hooks/data/admin/feedback'

export const metadata = { title: 'Feedback' }

export default function AdminFeedbackPage() {
  return (
    <Stack spacing={2}>
      <Typography variant="h5">Feedback</Typography>
      <Suspense fallback={<Skeleton height={400} variant="rounded" />}>
        <FeedbackContent />
      </Suspense>
    </Stack>
  )
}

async function FeedbackContent() {
  const rows = await getFeedback()
  return <FeedbackView rows={rows} />
}
