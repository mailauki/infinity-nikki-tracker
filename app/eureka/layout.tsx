import { Suspense } from 'react'
import { getUserID } from '@/hooks/user'
import EurekaDataProvider from '@/components/eureka/eureka-data-provider'
import { SortProvider } from '@/components/sort-context'

async function EurekaProviders({ children }: { children: React.ReactNode }) {
  const userId = await getUserID()

  return (
    <EurekaDataProvider isLoggedIn={!!userId} userId={userId}>
      {children}
    </EurekaDataProvider>
  )
}

export default function EurekaLayout({ children }: { children: React.ReactNode }) {
  return (
    <SortProvider>
      <Suspense>
        <EurekaProviders>{children}</EurekaProviders>
      </Suspense>
    </SortProvider>
  )
}
