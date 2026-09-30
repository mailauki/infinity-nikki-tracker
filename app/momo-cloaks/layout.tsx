import { Suspense } from 'react'

import { OutfitImageModeProvider } from '@/components/outfits/outfit-image-mode-context'
import { SortProvider } from '@/components/sort-context'
import { loadCloakData } from './load-cloak-data'
import MomoCloakDataProvider from './momo-cloak-data-provider'
import MomoCloaksLoading from './loading'

async function MomoCloakProviders({ children }: { children: React.ReactNode }) {
  const data = await loadCloakData()

  // OutfitImageModeProvider is reused rather than duplicated: it owns exactly the
  // main/alt image swap this page needs and has no dependency on the outfit data
  // context, so it mounts standalone. Note the mode is shared with /outfits via
  // the `outfit_image_mode` preference — switching here also switches there.
  return (
    <SortProvider isLoggedIn={data.isLoggedIn}>
      <OutfitImageModeProvider isLoggedIn={data.isLoggedIn}>
        <MomoCloakDataProvider {...data}>{children}</MomoCloakDataProvider>
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
