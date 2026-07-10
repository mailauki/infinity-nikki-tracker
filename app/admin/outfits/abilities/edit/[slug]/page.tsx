import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { getAbilityRaw } from '@/hooks/data/admin/abilities'
import EntityForm from '@/app/admin/entity-form'
import { editAbility } from './actions'

export const metadata: Metadata = {
  title: 'Edit Ability',
}

export default function EditAbilityPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditAbility params={params} />
      </Stack>
    </Suspense>
  )
}

async function EditAbility({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const ability = await getAbilityRaw(slug)

  if (!ability) notFound()

  return (
    <EntityForm
      showUpdateNext
      showUpdateOnly
      action={editAbility.bind(null, ability.slug)}
      formId="edit-ability"
      formKind="ability"
      initialValues={{
        title: ability.title,
        slug: ability.slug,
        image_url: ability.image_url,
      }}
      mode="edit"
    />
  )
}
