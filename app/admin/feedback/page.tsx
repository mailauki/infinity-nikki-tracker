import { Suspense } from 'react'
import { Skeleton, Stack, Typography } from '@mui/material'
import FeedbackView from './feedback-view'
import { getFeedback } from '@/hooks/data/admin/feedback'
import { pageTitle } from '@/lib/page-titles'

export const metadata = { title: pageTitle('/admin/feedback') }

export default function AdminFeedbackPage() {
  return (
    <Stack spacing={2}>
      <Typography variant="headline">Feedback</Typography>
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
