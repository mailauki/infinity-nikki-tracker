import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import { navLinksData } from '@/lib/nav-links'

export type RecentAdminItem = {
  slug: string
  title: string
  image_url: string | null
  type: string
  editHref: string
  date: string | null
}

const backDashboard = `?back=${encodeURIComponent('/admin')}`

function sortByDate(items: RecentAdminItem[], limit: number): RecentAdminItem[] {
  return items
    .sort((a, b) => {
      if (!a.date && !b.date) return 0
      if (!a.date) return 1
      if (!b.date) return -1
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
    .slice(0, limit)
}

export const getRecentlyAdded = cache(async (limit = 5): Promise<RecentAdminItem[]> => {
  const supabase = await createClient()

  const [{ data: eurekaSets }, { data: trials }, { data: outfitSets }, { data: evolutions }] =
    await Promise.all([
      supabase
        .from('eureka_sets')
        .select('slug, title, created_at')
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('trials')
        .select('slug, title, image_url, created_at')
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('outfit_sets')
        .select('slug, title, image_url, created_at')
        .not('created_at', 'is', null)
        .order('created_at', { ascending: false, nullsFirst: false })
        .limit(limit),
      supabase
        .from('evolutions')
        .select('slug, title, image_url, created_at')
        .order('created_at', { ascending: false })
        .limit(limit),
    ])

  const items: RecentAdminItem[] = [
    ...(eurekaSets ?? []).map((s) => ({
      slug: s.slug,
      title: s.title,
      image_url: null,
      type: navLinksData.admin.eureka.sets.title,
      editHref: `${navLinksData.admin.eureka.sets.edit}/${s.slug}${backDashboard}`,
      date: s.created_at,
    })),
    ...(trials ?? []).map((t) => ({
      slug: t.slug,
      title: t.title,
      image_url: t.image_url,
      type: navLinksData.admin.eureka.trials.title,
      editHref: `${navLinksData.admin.eureka.trials.edit}/${t.slug}${backDashboard}`,
      date: t.created_at,
    })),
    ...(outfitSets ?? []).map((o) => ({
      slug: o.slug,
      title: o.title,
      image_url: o.image_url,
      type: navLinksData.admin.outfits.sets.title,
      editHref: `${navLinksData.admin.outfits.sets.edit}/${o.slug}${backDashboard}`,
      date: o.created_at!,
    })),
    ...(evolutions ?? []).map((e) => ({
      slug: e.slug,
      title: e.title,
      image_url: e.image_url,
      type: navLinksData.admin.outfits.evolutions.title,
      editHref: `${navLinksData.admin.outfits.evolutions.edit}/${e.slug}${backDashboard}`,
      date: e.created_at,
    })),
  ]

  return sortByDate(items, limit)
})

export const getRecentlyEdited = cache(async (limit = 5): Promise<RecentAdminItem[]> => {
  const supabase = await createClient()

  const [{ data: eurekaSets }, { data: trials }, { data: outfitSets }, { data: evolutions }] =
    await Promise.all([
      supabase
        .from('eureka_sets')
        .select('slug, title, updated_at')
        .not('updated_at', 'is', null)
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(limit),
      supabase
        .from('trials')
        .select('slug, title, image_url, updated_at')
        .not('updated_at', 'is', null)
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(limit),
      supabase
        .from('outfit_sets')
        .select('slug, title, image_url, updated_at')
        .not('updated_at', 'is', null)
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(limit),
      supabase
        .from('evolutions')
        .select('slug, title, image_url, updated_at')
        .not('updated_at', 'is', null)
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(limit),
    ])

  const items: RecentAdminItem[] = [
    ...(eurekaSets ?? []).map((s) => ({
      slug: s.slug,
      title: s.title,
      image_url: null,
      type: navLinksData.admin.eureka.sets.title,
      editHref: `${navLinksData.admin.eureka.sets.edit}/${s.slug}${backDashboard}`,
      date: s.updated_at!,
    })),
    ...(trials ?? []).map((t) => ({
      slug: t.slug,
      title: t.title,
      image_url: t.image_url,
      type: navLinksData.admin.eureka.trials.title,
      editHref: `${navLinksData.admin.eureka.trials.edit}/${t.slug}${backDashboard}`,
      date: t.updated_at!,
    })),
    ...(outfitSets ?? []).map((o) => ({
      slug: o.slug,
      title: o.title,
      image_url: o.image_url,
      type: navLinksData.admin.outfits.sets.title,
      editHref: `${navLinksData.admin.outfits.sets.edit}/${o.slug}${backDashboard}`,
      date: o.updated_at!,
    })),
    ...(evolutions ?? []).map((e) => ({
      slug: e.slug,
      title: e.title,
      image_url: e.image_url,
      type: navLinksData.admin.outfits.evolutions.title,
      editHref: `${navLinksData.admin.outfits.evolutions.edit}/${e.slug}${backDashboard}`,
      date: e.updated_at!,
    })),
  ]

  return sortByDate(items, limit)
})
