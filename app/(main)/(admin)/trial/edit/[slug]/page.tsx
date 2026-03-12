import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import EditTrialForm from '@/components/forms/trial/edit-trial-form'
import { getTrialRaw } from '@/hooks/data/admin/trials'
import { Container, Stack } from '@mui/material'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Trial',
}

export default async function EditTrialPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ back?: string }>
}) {
  return (
    <Suspense>
      <Container maxWidth="sm" sx={{ flexGrow: 1, py: 3 }}>
        <Stack spacing={3}>
          <EditTrial params={params} searchParams={searchParams} />
        </Stack>
      </Container>
    </Suspense>
  )
}

async function EditTrial({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ back?: string }>
}) {
  const { slug } = await params
  const { back } = await searchParams

  const trial = await getTrialRaw(slug)

  if (!trial) notFound()

  return <EditTrialForm back={back} trial={trial} />
}
