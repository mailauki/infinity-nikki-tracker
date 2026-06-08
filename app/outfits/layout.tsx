import { Suspense } from 'react'
import { getUserID } from '@/hooks/user'
import OutfitDataProvider from '@/components/outfits/outfit-data-provider'
import { SortProvider } from '@/components/sort-context'

async function OutfitProviders({ children }: { children: React.ReactNode }) {
  const userId = await getUserID()

  return (
    <OutfitDataProvider isLoggedIn={!!userId} userId={userId}>
      {children}
    </OutfitDataProvider>
  )
}

export default function OutfitsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SortProvider>
      <Suspense>
        <OutfitProviders>{children}</OutfitProviders>
      </Suspense>
    </SortProvider>
  )
}
