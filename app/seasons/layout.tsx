import { Suspense } from 'react'
import { getUserID } from '@/hooks/user'
import { getPreferences } from '@/hooks/data/preferences'
import OutfitDataProvider from '@/app/outfits/outfit-data-provider'
import MakeupDataProvider from '@/app/makeup/makeup-data-provider'
import EurekaDataProvider from '@/app/eureka/eureka-data-provider'
import MomoCloakDataProvider from '@/app/momo-cloaks/momo-cloak-data-provider'
import { loadCloakData } from '@/app/momo-cloaks/load-cloak-data'
import { OutfitImageModeProvider } from '@/components/outfits/outfit-image-mode-context'
import { MakeupImageModeProvider } from '@/components/makeup/makeup-image-mode-context'
import { SortProvider } from '@/components/sort-context'
import { SeasonFilterProvider } from './[slug]/season-filter-context'
import SeasonsLoading from './loading'

// Seasons render outfit and makeup cards, so they need the same providers the
// outfits and makeup layouts mount. They stopped inheriting the outfit ones when
// this route moved out from under /outfits, and the contexts have defaults
// rather than throwing, so without this the pages render with empty sets and 0%
// progress.
//
// The makeup providers are here so a season's makeup pieces can use the same
// MakeupVariantCard the /makeup compact view uses — a shared card that toggles
// through MakeupDataProvider rather than a read-only copy. It costs one extra
// /api/makeup fetch on mount, which the provider already dedupes per session.
//
// Season pages now also list eureka sets and cloaks through their real
// providers, so their toggles work.
async function SeasonProviders({ children }: { children: React.ReactNode }) {
  const userId = await getUserID()
  const [preferences, cloakData] = await Promise.all([
    userId ? getPreferences(userId) : undefined,
    loadCloakData(),
  ])

  return (
    <SortProvider isLoggedIn={!!userId}>
      <OutfitDataProvider isLoggedIn={!!userId} userId={userId}>
        <MakeupDataProvider isLoggedIn={!!userId} userId={userId}>
          <EurekaDataProvider isLoggedIn={!!userId} userId={userId}>
            <MomoCloakDataProvider {...cloakData}>
              <OutfitImageModeProvider isLoggedIn={!!userId}>
                <MakeupImageModeProvider isLoggedIn={!!userId}>
                  <SeasonFilterProvider isLoggedIn={!!userId} preferences={preferences}>
                    {children}
                  </SeasonFilterProvider>
                </MakeupImageModeProvider>
              </OutfitImageModeProvider>
            </MomoCloakDataProvider>
          </EurekaDataProvider>
        </MakeupDataProvider>
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
