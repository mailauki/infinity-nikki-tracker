import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import EditTrialForm from './edit-trial-form'
import { getTrialRaw } from '@/hooks/data/admin/trials'
import { Stack } from '@mui/material'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Trial',
}

export default async function EditTrialPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditTrial params={params} />
      </Stack>
    </Suspense>
  )
}

async function EditTrial({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const trial = await getTrialRaw(slug)
  if (!trial) notFound()

  const back = '/dashboard/eureka/trials'

  return <EditTrialForm back={back} trial={trial} />
}
