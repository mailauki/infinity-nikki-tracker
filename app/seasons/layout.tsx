import { Suspense } from 'react'
import { getUserID } from '@/hooks/user'
import OutfitDataProvider from '@/app/outfits/outfit-data-provider'
import { OutfitImageModeProvider } from '@/components/outfits/outfit-image-mode-context'
import { SortProvider } from '@/components/sort-context'
import SeasonsLoading from './loading'

// Seasons render outfit and makeup cards, so they need the same providers the
// outfits layout mounts. They stopped inheriting them when this route moved out
// from under /outfits, and the contexts have defaults rather than throwing, so
// without this the pages render with empty sets and 0% progress.
async function SeasonProviders({ children }: { children: React.ReactNode }) {
  const userId = await getUserID()

  return (
    <SortProvider isLoggedIn={!!userId}>
      <OutfitDataProvider isLoggedIn={!!userId} userId={userId}>
        <OutfitImageModeProvider isLoggedIn={!!userId}>{children}</OutfitImageModeProvider>
      </OutfitDataProvider>
    </SortProvider>
  )
}

export default function SeasonsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<SeasonsLoading />}>
      <SeasonProviders>{children}</SeasonProviders>
    </Suspense>
  )
}
