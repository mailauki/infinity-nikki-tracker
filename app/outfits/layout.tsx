import { Suspense } from 'react'
import { getUserID } from '@/hooks/user'
import OutfitDataProvider from '@/components/outfits/outfit-data-provider'
import { OutfitImageModeProvider } from '@/components/outfits/outfit-image-mode-context'
import { SortProvider } from '@/components/sort-context'
import OutfitsLoading from './loading'

async function OutfitProviders({ children }: { children: React.ReactNode }) {
  const userId = await getUserID()

  return (
    <OutfitDataProvider isLoggedIn={!!userId} userId={userId}>
      <OutfitImageModeProvider isLoggedIn={!!userId}>{children}</OutfitImageModeProvider>
    </OutfitDataProvider>
  )
}

export default function OutfitsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SortProvider>
      <Suspense fallback={<OutfitsLoading />}>
        <OutfitProviders>{children}</OutfitProviders>
      </Suspense>
    </SortProvider>
  )
}
