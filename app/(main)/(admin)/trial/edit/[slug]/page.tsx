import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import EditTrialForm from '@/components/forms/trial/edit-trial-form'
import { getTrialRaw } from '@/hooks/data/admin/trials'
import { Metadata } from 'next'
import PageContainer from '@/components/page-container'

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
      <PageContainer title="Edit Trial" size="sm">
        <EditTrial params={params} searchParams={searchParams} />
      </PageContainer>
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

  return <EditTrialForm trial={trial} back={back} />
}
