import { Suspense } from 'react'

import { getEurekaSets, getObtained } from '@/lib/data'
import { getUserID } from '@/hooks/user'
import RealtimeEurekaFilter from '@/components/realtime-eureka-filter'
import LoginAlert from '@/components/login-alert'
import { Container } from '@mui/material'

export default async function MissingPage() {
  return (
    <Suspense>
      <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
        <Missing />
      </Container>
    </Suspense>
  )
}

async function Missing() {
  const eurekaSets = await getEurekaSets()
  const categories = [...new Set(eurekaSets.flatMap((eurekaSet) => eurekaSet.categories))]
  const user_id = await getUserID()
  const isLoggedIn = !!user_id!
  const obtained = await getObtained(user_id!)
  const eureka = eurekaSets.flatMap((eurekaSet) => eurekaSet.eureka_variants)

  if (!isLoggedIn) return <LoginAlert />

  return (
    <RealtimeEurekaFilter
      serverEureka={eureka}
      serverCategories={categories}
      serverObtained={obtained || []}
      isLoggedIn={isLoggedIn}
    />
  )
}
