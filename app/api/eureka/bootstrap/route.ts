import { NextResponse, connection } from 'next/server'

import { getUserID } from '@/hooks/user'
import { getEurekaSets } from '@/hooks/data/eureka-sets'
import { getEurekaCategories } from '@/hooks/data/eureka-categories'
import { getEurekaColors } from '@/hooks/data/eureka-colors'
import { getTrials } from '@/hooks/data/trials'
import { getObtainedEureka } from '@/hooks/data/obtained-eureka'
import { ObtainedEureka } from '@/lib/types/eureka'

// Single round-trip for everything the eureka page provider needs. Each hook is
// React cache()-deduped within the request, so calling getEurekaSets() (which
// also pulls obtained) alongside getObtainedEureka() does not double-query.
//
// Not auth-gated: logged-out visitors browse with obtained = []. getEurekaSets
// guards its own obtained join for anonymous users, so the public payload
// (sets/categories/colors/trials) still returns.
export async function GET() {
  // Reads auth cookies (getUserID) per request — defer to request time so PPR
  // doesn't prerender this route, where cookies() would reject at build. Kept
  // outside try/catch so the prerender-abort signal propagates to React instead
  // of being swallowed and reported as a 500.
  await connection()

  try {
    const userId = await getUserID()

    const [sets, categories, colors, trials, obtained] = await Promise.all([
      getEurekaSets(),
      getEurekaCategories(),
      getEurekaColors(),
      getTrials(),
      userId ? getObtainedEureka(userId) : Promise.resolve<ObtainedEureka[]>([]),
    ])

    return NextResponse.json({ sets, categories, colors, trials, obtained })
  } catch (error) {
    console.error('Failed to fetch eureka bootstrap:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
