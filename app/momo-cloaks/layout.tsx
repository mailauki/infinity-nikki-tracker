import { Suspense } from 'react'

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

  return (
    <MomoCloakDataProvider
      cloaks={cloaks}
      isError={isError}
      isLoggedIn={!!userId}
      isObtainedError={isObtainedError}
      obtainedSlugs={obtainedSlugs}
    >
      {children}
    </MomoCloakDataProvider>
  )
}

export default function MomoCloaksLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<MomoCloaksLoading />}>
      <MomoCloakProviders>{children}</MomoCloakProviders>
    </Suspense>
  )
}
