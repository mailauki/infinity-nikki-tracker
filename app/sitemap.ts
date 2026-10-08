import type { MetadataRoute } from 'next'
import { cacheLife } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import { SITEMAP_ROUTES } from '@/lib/sitemap/page-titles'
import { SITE_URL } from '@/lib/sitemap/site-url'

type Row = { slug: string; updated_at: string | null }

// Detail pages, one per record. Evolutions have no route of their own (they
// render under their base via `?evolution=`), so outfits and makeup list base
// sets only.
async function detailEntries(): Promise<MetadataRoute.Sitemap> {
  'use cache'
  cacheLife('days')

  const supabase = createPublicClient()
  const [outfits, makeup, eureka, trials, cloaks, seasons] = await Promise.all([
    supabase.from('outfit_sets').select('slug, updated_at').is('base_set', null),
    supabase.from('makeup_sets').select('slug, updated_at').is('base_set', null),
    supabase.from('eureka_sets').select('slug, updated_at'),
    supabase.from('trials').select('slug, updated_at'),
    supabase.from('momo_cloaks').select('slug, updated_at'),
    supabase.from('seasons').select('slug, updated_at'),
  ])

  const entries = (prefix: string, rows: Row[] | null) =>
    (rows ?? []).map((row) => ({
      url: `${SITE_URL}${prefix}/${row.slug}`,
      lastModified: row.updated_at ?? undefined,
    }))

  return [
    ...entries('/outfits', outfits.data),
    ...entries('/makeup', makeup.data),
    ...entries('/eureka', eureka.data),
    ...entries('/eureka/trials', trials.data),
    ...entries('/momo-cloaks', cloaks.data),
    ...entries('/seasons', seasons.data),
  ]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    // Static pages flagged `sitemap: true` in the route registry. Account, auth,
    // admin, search and user content (/looks, /u/[username]) are left out.
    ...SITEMAP_ROUTES.map((route) => ({ url: `${SITE_URL}${route === '/' ? '' : route}` })),
    ...(await detailEntries()),
  ]
}
