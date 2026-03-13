import { Suspense } from 'react'

import { getUserID } from '@/hooks/user'
import { Metadata } from 'next'
import EurekaDataProvider from '@/components/eureka/eureka-data-provider'

export const metadata: Metadata = {
  title: 'Eureka Sets',
}

export default async function EurekaSetsPage() {
  const user_id = await getUserID()
  const isLoggedIn = !!user_id

  return (
    <Suspense>
      <EurekaDataProvider isLoggedIn={isLoggedIn} userId={user_id} />
    </Suspense>
  )
}
