import { getAbilitiesRaw } from '@/hooks/data/admin/abilities'
import { Suspense } from 'react'
import OutfitAbilityView from './outfit-ability-view'
import { pageTitle } from '@/lib/page-titles'

export const metadata = { title: pageTitle('/admin/outfits/abilities') }

export default function OutfitAbilitiesAdminPage() {
  return (
    <Suspense>
      <AdminView />
    </Suspense>
  )
}

async function AdminView() {
  const abilities = await getAbilitiesRaw()

  return <OutfitAbilityView abilities={abilities} />
}
