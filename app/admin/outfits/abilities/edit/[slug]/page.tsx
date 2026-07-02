import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { navLinksData } from '@/lib/nav-links'
import { getAbilityRaw } from '@/hooks/data/admin/abilities'
import EntityForm from '@/app/admin/entity-form'
import { editAbility } from './actions'

export const metadata: Metadata = {
  title: 'Edit Ability',
}

export default function EditAbilityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ back?: string }>
}) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditAbility params={params} searchParams={searchParams} />
      </Stack>
    </Suspense>
  )
}

async function EditAbility({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ back?: string }>
}) {
  const { slug } = await params
  const { back: backParam } = await searchParams
  const back = backParam?.startsWith('/admin/')
    ? backParam
    : navLinksData.admin.outfits.abilities.list

  const ability = await getAbilityRaw(slug)

  if (!ability) notFound()

  return (
    <EntityForm
      showUpdateNext
      showUpdateOnly
      action={editAbility.bind(null, ability.slug, back)}
      backUrl={back}
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
