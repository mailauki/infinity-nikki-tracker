import { Suspense } from 'react'
import { getUserID } from '@/hooks/user'
import OutfitDataProvider from '@/components/outfits/outfit-data-provider'
import { SortProvider } from '@/components/sort-context'
import OutfitsLoading from './loading'

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
    <SortProvider defaultOrder="old">
      <Suspense fallback={<OutfitsLoading />}>
        <OutfitProviders>{children}</OutfitProviders>
      </Suspense>
    </SortProvider>
  )
}
