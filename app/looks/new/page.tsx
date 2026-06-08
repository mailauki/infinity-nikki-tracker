import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { Suspense } from 'react'
import { Skeleton, Stack, Typography } from '@mui/material'
import { getUserID } from '@/hooks/user'
import { createClient } from '@/lib/supabase/server'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { getOutfitSets } from '@/hooks/data/outfit-sets'
import { getCustomLooks } from '@/hooks/data/custom-looks'
import { FREE_LOOKS_LIMIT } from '@/lib/types/looks'
import { flattenEurekaVariants, flattenOutfitVariants } from '@/lib/look-utils'
import LookBuilder from '@/components/looks/look-builder'
import NavBarToolbar from '@/components/navbar/navbar-toolbar'
import { createLook } from '../actions'

export const metadata: Metadata = { title: 'New Look' }

export default function NewLookPage() {
  return (
    <Suspense fallback={<BuilderLoading />}>
      <NewLookContent />
    </Suspense>
  )
}

async function NewLookContent() {
  const user_id = await getUserID()
  if (!user_id) redirect('/login')

  const supabase = await createClient()
  const [looks, { data: profile }, eurekaSets, outfitSets] = await Promise.all([
    getCustomLooks(user_id),
    supabase.from('profiles').select('is_premium').eq('id', user_id).single(),
    getEurekaSets(),
    getOutfitSets(),
  ])

  const isPremium = profile?.is_premium ?? false
  if (!isPremium && looks.length >= FREE_LOOKS_LIMIT) redirect('/looks')

  const eurekaVariants = flattenEurekaVariants(eurekaSets ?? [])
  const outfitVariants = flattenOutfitVariants(outfitSets ?? [])

  return (
    <>
      <NavBarToolbar>
        <Typography variant="subtitle2">New Look</Typography>
      </NavBarToolbar>

      <LookBuilder
        eurekaVariants={eurekaVariants}
        outfitVariants={outfitVariants}
        onSave={createLook}
      />
    </>
  )
}

function BuilderLoading() {
  return (
    <Stack spacing={2}>
      <Skeleton height={56} variant="rounded" />
      <Skeleton height={400} variant="rounded" />
    </Stack>
  )
}
