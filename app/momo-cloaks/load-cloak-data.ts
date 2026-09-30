import { getMomoCloaks } from '@/hooks/data/momo-cloaks'
import { getObtainedMomoCloaks } from '@/hooks/data/obtained-momo-cloaks'
import { getUserID } from '@/hooks/user'

// Server-side inputs for MomoCloakDataProvider. Shared by /momo-cloaks and
// /seasons so both mount the provider with identical failure handling.
export async function loadCloakData() {
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

  return { cloaks, obtainedSlugs, isError, isObtainedError, isLoggedIn: !!userId }
}
