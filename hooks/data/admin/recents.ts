import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import { navLinksData } from '@/lib/nav-links'
import { toTitle } from '@/lib/utils'

export type RecentAdminItem = {
  slug: string
  title: string
  image_url: string | null
  type: string
  editHref: string
  href: string
  date: string | null
}

// Public-page URLs, matching the link builders the cards already use:
// - eureka variant slug `{set}-{category}-{color}` → `/eureka/{set}?color={color}`
//   (see eureka-color-set-card.tsx)
// - evolution slug `{base}-{evo}` → `/outfits/{base}?evolution={evo}`
//   (see outfit-set-card.tsx / virtual-grouped-grid.tsx / outfit-set-item.tsx)
// An outfit variant's own slug is `{outfit_set}-{category}` where `outfit_set` is
// itself either a base or an evolution slug, so it can't be split apart — link via
// the variant's `outfit_set` column instead.
function eurekaVariantHref(slug: string): string {
  const parts = slug.split('-')
  return `${navLinksData.admin.eureka.variants.main}/${parts[0]}?color=${parts[parts.length - 1]}`
}

function outfitSetHref(setSlug: string): string {
  return setSlug.includes('-')
    ? `${navLinksData.admin.outfits.sets.main}/${setSlug.replace('-', '?evolution=')}`
    : `${navLinksData.admin.outfits.sets.main}/${setSlug}?evolution=base`
}

// The eureka set thumbnail is its default head variant's image (default variant
// as fallback), matching createEurekaSet / the eureka slug page. The set rows
// themselves have no image_url column, so resolve it from eureka_variants.
async function eurekaSetImages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  setSlugs: string[]
): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>()
  if (setSlugs.length === 0) return map
  const { data } = await supabase
    .from('eureka_variants')
    .select('eureka_set, category, image_url, default')
    .in('eureka_set', setSlugs)
    .eq('default', true)
  for (const slug of setSlugs) {
    const defaults = (data ?? []).filter((v) => v.eureka_set === slug)
    const head = defaults.find((v) => v.category === 'head')
    map.set(slug, (head ?? defaults[0])?.image_url ?? null)
  }
  return map
}

export const getRecentlyAdded = cache(async (limit = 5): Promise<RecentAdminItem[]> => {
  const supabase = await createClient()

  const [
    { data: eurekaSets },
    { data: eurekaVariants },
    { data: trials },
    { data: outfitSets },
    { data: outfitVariants },
    { data: evolutions },
  ] = await Promise.all([
    supabase
      .from('eureka_sets')
      .select('slug, title, created_at')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('eureka_variants')
      .select('slug, image_url, created_at')
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
      .is('base_set', null)
      .not('created_at', 'is', null)
      .order('created_at', { ascending: false, nullsFirst: false })
      .limit(limit),
    supabase
      .from('outfit_variants')
      .select('slug, title, image_url, outfit_set, created_at')
      .not('created_at', 'is', null)
      .order('created_at', { ascending: false, nullsFirst: false })
      .limit(limit),
    supabase
      .from('outfit_sets')
      .select('slug, title, image_url, created_at')
      .not('base_set', 'is', null)
      .not('created_at', 'is', null)
      .order('created_at', { ascending: false, nullsFirst: false })
      .limit(limit),
  ])

  const eurekaImages = await eurekaSetImages(
    supabase,
    (eurekaSets ?? []).map((s) => s.slug)
  )

  return [
    ...(eurekaSets ?? []).map((s) => ({
      slug: s.slug,
      title: s.title,
      image_url: eurekaImages.get(s.slug) ?? null,
      type: navLinksData.admin.eureka.sets.title,
      editHref: `${navLinksData.admin.eureka.sets.edit}/${s.slug}`,
      href: `${navLinksData.admin.eureka.sets.main}/${s.slug}`,
      date: s.created_at,
    })),
    ...(eurekaVariants ?? []).map((v) => ({
      slug: v.slug,
      title: toTitle(v.slug),
      image_url: v.image_url,
      type: navLinksData.admin.eureka.variants.title,
      editHref: `${navLinksData.admin.eureka.variants.edit}/${v.slug}`,
      href: eurekaVariantHref(v.slug),
      date: v.created_at,
    })),
    ...(trials ?? []).map((t) => ({
      slug: t.slug,
      title: t.title,
      image_url: t.image_url,
      type: navLinksData.admin.eureka.trials.title,
      editHref: `${navLinksData.admin.eureka.trials.edit}/${t.slug}`,
      href: `${navLinksData.admin.eureka.trials.main}/${t.slug}`,
      date: t.created_at,
    })),
    ...(outfitSets ?? []).map((o) => ({
      slug: o.slug,
      title: o.title,
      image_url: o.image_url,
      type: navLinksData.admin.outfits.sets.title,
      editHref: `${navLinksData.admin.outfits.sets.edit}/${o.slug}`,
      href: outfitSetHref(o.slug),
      date: o.created_at!,
    })),
    ...(outfitVariants ?? []).map((v) => ({
      slug: v.slug,
      title: v.title ?? toTitle(v.slug),
      image_url: v.image_url,
      type: navLinksData.admin.outfits.variants.title,
      editHref: `${navLinksData.admin.outfits.variants.edit}/${v.slug}`,
      href: outfitSetHref(v.outfit_set ?? v.slug),
      date: v.created_at,
    })),
    ...(evolutions ?? []).map((e) => ({
      slug: e.slug,
      title: e.title,
      image_url: e.image_url,
      type: navLinksData.admin.outfits.evolutions.title,
      editHref: `${navLinksData.admin.outfits.evolutions.edit}/${e.slug}`,
      href: outfitSetHref(e.slug),
      date: e.created_at,
    })),
  ]
})

export const getRecentlyEdited = cache(async (limit = 5): Promise<RecentAdminItem[]> => {
  const supabase = await createClient()

  const [
    { data: eurekaSets },
    { data: eurekaVariants },
    { data: trials },
    { data: outfitSets },
    { data: outfitVariants },
    { data: evolutions },
  ] = await Promise.all([
    supabase
      .from('eureka_sets')
      .select('slug, title, updated_at')
      .not('updated_at', 'is', null)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(limit),
    supabase
      .from('eureka_variants')
      .select('slug, image_url, updated_at')
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
      .is('base_set', null)
      .not('updated_at', 'is', null)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(limit),
    supabase
      .from('outfit_variants')
      .select('slug, title, image_url, outfit_set, updated_at')
      .not('updated_at', 'is', null)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(limit),
    supabase
      .from('outfit_sets')
      .select('slug, title, image_url, updated_at')
      .not('base_set', 'is', null)
      .not('updated_at', 'is', null)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(limit),
  ])

  const eurekaImages = await eurekaSetImages(
    supabase,
    (eurekaSets ?? []).map((s) => s.slug)
  )

  return [
    ...(eurekaSets ?? []).map((s) => ({
      slug: s.slug,
      title: s.title,
      image_url: eurekaImages.get(s.slug) ?? null,
      type: navLinksData.admin.eureka.sets.title,
      editHref: `${navLinksData.admin.eureka.sets.edit}/${s.slug}`,
      href: `${navLinksData.admin.eureka.sets.main}/${s.slug}`,
      date: s.updated_at!,
    })),
    ...(eurekaVariants ?? []).map((v) => ({
      slug: v.slug,
      title: toTitle(v.slug),
      image_url: v.image_url,
      type: navLinksData.admin.eureka.variants.title,
      editHref: `${navLinksData.admin.eureka.variants.edit}/${v.slug}`,
      href: eurekaVariantHref(v.slug),
      date: v.updated_at!,
    })),
    ...(trials ?? []).map((t) => ({
      slug: t.slug,
      title: t.title,
      image_url: t.image_url,
      type: navLinksData.admin.eureka.trials.title,
      editHref: `${navLinksData.admin.eureka.trials.edit}/${t.slug}`,
      href: `${navLinksData.admin.eureka.trials.main}/${t.slug}`,
      date: t.updated_at!,
    })),
    ...(outfitSets ?? []).map((o) => ({
      slug: o.slug,
      title: o.title,
      image_url: o.image_url,
      type: navLinksData.admin.outfits.sets.title,
      editHref: `${navLinksData.admin.outfits.sets.edit}/${o.slug}`,
      href: outfitSetHref(o.slug),
      date: o.updated_at!,
    })),
    ...(outfitVariants ?? []).map((v) => ({
      slug: v.slug,
      title: v.title ?? toTitle(v.slug),
      image_url: v.image_url,
      type: navLinksData.admin.outfits.variants.title,
      editHref: `${navLinksData.admin.outfits.variants.edit}/${v.slug}`,
      href: outfitSetHref(v.outfit_set ?? v.slug),
      date: v.updated_at!,
    })),
    ...(evolutions ?? []).map((e) => ({
      slug: e.slug,
      title: e.title,
      image_url: e.image_url,
      type: navLinksData.admin.outfits.evolutions.title,
      editHref: `${navLinksData.admin.outfits.evolutions.edit}/${e.slug}`,
      href: outfitSetHref(e.slug),
      date: e.updated_at!,
    })),
  ]
})
