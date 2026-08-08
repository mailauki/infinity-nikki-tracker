import { Suspense } from 'react'

import { OutfitImageModeProvider } from '@/components/outfits/outfit-image-mode-context'
import { SortProvider } from '@/components/sort-context'
import { getMomoCloaks } from '@/hooks/data/momo-cloaks'
import { getObtainedMomoCloaks } from '@/hooks/data/obtained-momo-cloaks'
import { getUserID } from '@/hooks/user'

import MomoCloakDataProvider from './momo-cloak-data-provider'
import MomoCloaksLoading from './loading'

async function MomoCloakProviders({ children }: { children: React.ReactNode }) {
  const userId = await getUserID()

  // A failed cloak fetch leaves nothing to show — the grid renders an
  // ErrorAlert instead of a confident "0 of 0 cloaks" empty state.
  let cloaks: Awaited<ReturnType<typeof getMomoCloaks>> = []
  let isError = false
  try {
    cloaks = await getMomoCloaks()
  } catch (err) {
    console.error('Failed to load momo cloaks:', err)
    isError = true
  }

  // getUserID() returns null when signed out — never pass that to a user-scoped
  // query. A failed obtained fetch still renders the grid, with toggles disabled.
  let obtainedSlugs: string[] = []
  let isObtainedError = false
  if (userId) {
    try {
      const obtained = await getObtainedMomoCloaks(userId)
      obtainedSlugs = obtained.map((o) => o.momo_cloak).filter((slug): slug is string => !!slug)
    } catch (err) {
      console.error('Failed to load obtained momo cloaks:', err)
      isObtainedError = true
    }
  }

  // OutfitImageModeProvider is reused rather than duplicated: it owns exactly the
  // main/alt image swap this page needs and has no dependency on the outfit data
  // context, so it mounts standalone. Note the mode is shared with /outfits via
  // the `outfit_image_mode` preference — switching here also switches there.
  return (
    <SortProvider isLoggedIn={!!userId}>
      <OutfitImageModeProvider isLoggedIn={!!userId}>
        <MomoCloakDataProvider
          cloaks={cloaks}
          isError={isError}
          isLoggedIn={!!userId}
          isObtainedError={isObtainedError}
          obtainedSlugs={obtainedSlugs}
        >
          {children}
        </MomoCloakDataProvider>
      </OutfitImageModeProvider>
    </SortProvider>
  )
}

export default function MomoCloaksLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<MomoCloaksLoading />}>
      <MomoCloakProviders>{children}</MomoCloakProviders>
    </Suspense>
  )
}
