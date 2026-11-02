import { NextResponse, connection } from 'next/server'

import { getEurekaCatalogSets } from '@/hooks/data/eureka-sets'
import { getEurekaCategories } from '@/hooks/data/eureka-categories'
import { getEurekaColors } from '@/hooks/data/eureka-colors'
import { getTrials } from '@/hooks/data/trials'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import { catalogHeaders } from '@/lib/catalog-cache'

// Single round-trip for the eureka catalogue. Public data only, so it is
// CDN-cached (lib/catalog-cache.ts); the viewer's obtained rows come from
// /api/obtained-eureka.
export async function GET(request: Request) {
  // The data hooks read cookies through the server client — defer to request
  // time so PPR doesn't prerender this route, where cookies() would reject at
  // build. Kept outside try/catch so the prerender-abort signal propagates to
  // React instead of being swallowed and reported as a 500.
  await connection()

  try {
    const [sets, categories, colors, trials, styles, labels] = await Promise.all([
      getEurekaCatalogSets(),
      getEurekaCategories(),
      getEurekaColors(),
      getTrials(),
      getStyles(),
      getLabels(),
    ])

    return NextResponse.json(
      { sets, categories, colors, trials, styles, labels },
      { headers: catalogHeaders(request) }
    )
  } catch (error) {
    console.error('Failed to fetch eureka catalogue:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
