import { Suspense } from 'react'
import { Metadata } from 'next'
import { getUserID } from '@/hooks/user'
import EurekaDataProvider from '@/components/eureka/eureka-data-provider'
import { SortProvider } from '@/components/sort-context'
import FilterEureka from '@/components/eureka/filter/filter-eureka'
import EurekaLoading from './loading'

export const metadata: Metadata = {
  title: 'Eureka Sets',
}

export default async function EurekaSetsPage() {
  const userId = await getUserID()

  return (
    <SortProvider>
      <EurekaDataProvider isLoggedIn={!!userId} userId={userId}>
        <Suspense fallback={<EurekaLoading />}>
          <FilterEureka />
        </Suspense>
      </EurekaDataProvider>
    </SortProvider>
  )
}
