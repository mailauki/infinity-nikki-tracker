import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import { toTitle } from '@/lib/utils'
import { editPath, pageTitle } from '@/lib/sitemap/page-titles'

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
  return `/eureka/${parts[0]}?color=${parts[parts.length - 1]}`
}

function outfitSetHref(setSlug: string): string {
  return setSlug.includes('-')
    ? `/outfits/${setSlug.replace('-', '?evolution=')}`
    : `/outfits/${setSlug}?evolution=base`
}

// Makeup, momo cloak, season category and ability rows link to their admin edit
// form. Makeup and momo cloaks have public detail pages now, so those two could
// switch to them (makeup evolutions need linkedSetHref-style URLs).

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
    { data: makeupSets },
    { data: makeupVariants },
    { data: momoCloaks },
    { data: seasons },
    { data: seasonCategories },
    { data: abilities },
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
    supabase
      .from('makeup_sets')
      .select('slug, title, image_url, created_at')
      .not('created_at', 'is', null)
      .order('created_at', { ascending: false, nullsFirst: false })
      .limit(limit),
    supabase
      .from('makeup_variants')
      .select('slug, title, image_url, created_at')
      .not('created_at', 'is', null)
      .order('created_at', { ascending: false, nullsFirst: false })
      .limit(limit),
    supabase
      .from('momo_cloaks')
      .select('slug, title, image_url, created_at')
      .not('created_at', 'is', null)
      .order('created_at', { ascending: false, nullsFirst: false })
      .limit(limit),
    supabase
      .from('seasons')
      .select('slug, title, image_url, created_at')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('season_categories')
      .select('slug, title, image_url, created_at')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('abilities')
      .select('slug, title, image_url, created_at')
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
      type: pageTitle('/admin/eureka/sets'),
      editHref: editPath('/admin/eureka/sets', s.slug),
      href: `/eureka/${s.slug}`,
      date: s.created_at,
    })),
    ...(eurekaVariants ?? []).map((v) => ({
      slug: v.slug,
      title: toTitle(v.slug),
      image_url: v.image_url,
      type: pageTitle('/admin/eureka/variants'),
      editHref: editPath('/admin/eureka/variants', v.slug),
      href: eurekaVariantHref(v.slug),
      date: v.created_at,
    })),
    ...(trials ?? []).map((t) => ({
      slug: t.slug,
      title: t.title,
      image_url: t.image_url,
      type: pageTitle('/admin/eureka/trials'),
      editHref: editPath('/admin/eureka/trials', t.slug),
      href: `/eureka/trials/${t.slug}`,
      date: t.created_at,
    })),
    ...(outfitSets ?? []).map((o) => ({
      slug: o.slug,
      title: o.title,
      image_url: o.image_url,
      type: pageTitle('/admin/outfits/sets'),
      editHref: editPath('/admin/outfits/sets', o.slug),
      href: outfitSetHref(o.slug),
      date: o.created_at!,
    })),
    ...(outfitVariants ?? []).map((v) => ({
      slug: v.slug,
      title: v.title ?? toTitle(v.slug),
      image_url: v.image_url,
      type: pageTitle('/admin/outfits/variants'),
      editHref: editPath('/admin/outfits/variants', v.slug),
      href: outfitSetHref(v.outfit_set ?? v.slug),
      date: v.created_at,
    })),
    ...(evolutions ?? []).map((e) => ({
      slug: e.slug,
      title: e.title,
      image_url: e.image_url,
      type: pageTitle('/admin/outfits/evolutions'),
      editHref: editPath('/admin/outfits/evolutions', e.slug),
      href: outfitSetHref(e.slug),
      date: e.created_at,
    })),
    ...(makeupSets ?? []).map((m) => ({
      slug: m.slug,
      title: m.title,
      image_url: m.image_url,
      type: pageTitle('/admin/makeup/sets'),
      editHref: editPath('/admin/makeup/sets', m.slug),
      href: editPath('/admin/makeup/sets', m.slug),
      date: m.created_at,
    })),
    ...(makeupVariants ?? []).map((v) => ({
      slug: v.slug,
      title: v.title ?? toTitle(v.slug),
      image_url: v.image_url,
      type: pageTitle('/admin/makeup/variants'),
      editHref: editPath('/admin/makeup/variants', v.slug),
      href: editPath('/admin/makeup/variants', v.slug),
      date: v.created_at,
    })),
    ...(momoCloaks ?? []).map((c) => ({
      slug: c.slug,
      title: c.title,
      image_url: c.image_url,
      type: pageTitle('/admin/momo-cloaks'),
      editHref: editPath('/admin/momo-cloaks', c.slug),
      href: editPath('/admin/momo-cloaks', c.slug),
      date: c.created_at,
    })),
    ...(seasons ?? []).map((s) => ({
      slug: s.slug,
      title: s.title,
      image_url: s.image_url,
      type: pageTitle('/admin/outfits/seasons'),
      editHref: editPath('/admin/outfits/seasons', s.slug),
      href: `/seasons/${s.slug}`,
      date: s.created_at,
    })),
    ...(seasonCategories ?? []).map((c) => ({
      slug: c.slug,
      title: c.title,
      image_url: c.image_url,
      type: pageTitle('/admin/outfits/season-categories'),
      editHref: editPath('/admin/outfits/season-categories', c.slug),
      // Season categories have no public page of their own — only a filter on /outfits.
      href: editPath('/admin/outfits/season-categories', c.slug),
      date: c.created_at,
    })),
    ...(abilities ?? []).map((a) => ({
      slug: a.slug,
      title: a.title,
      image_url: a.image_url,
      type: pageTitle('/admin/outfits/abilities'),
      editHref: editPath('/admin/outfits/abilities', a.slug),
      // Abilities are a lookup surfaced as a field on outfit sets, not a page.
      href: editPath('/admin/outfits/abilities', a.slug),
      date: a.created_at,
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
    { data: makeupSets },
    { data: makeupVariants },
    { data: momoCloaks },
    { data: seasons },
    { data: seasonCategories },
    { data: abilities },
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
    supabase
      .from('makeup_sets')
      .select('slug, title, image_url, updated_at')
      .not('updated_at', 'is', null)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(limit),
    supabase
      .from('makeup_variants')
      .select('slug, title, image_url, updated_at')
      .not('updated_at', 'is', null)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(limit),
    supabase
      .from('momo_cloaks')
      .select('slug, title, image_url, updated_at')
      .not('updated_at', 'is', null)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(limit),
    supabase
      .from('seasons')
      .select('slug, title, image_url, updated_at')
      .not('updated_at', 'is', null)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(limit),
    supabase
      .from('season_categories')
      .select('slug, title, image_url, updated_at')
      .not('updated_at', 'is', null)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(limit),
    supabase
      .from('abilities')
      .select('slug, title, image_url, updated_at')
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
      type: pageTitle('/admin/eureka/sets'),
      editHref: editPath('/admin/eureka/sets', s.slug),
      href: `/eureka/${s.slug}`,
      date: s.updated_at!,
    })),
    ...(eurekaVariants ?? []).map((v) => ({
      slug: v.slug,
      title: toTitle(v.slug),
      image_url: v.image_url,
      type: pageTitle('/admin/eureka/variants'),
      editHref: editPath('/admin/eureka/variants', v.slug),
      href: eurekaVariantHref(v.slug),
      date: v.updated_at!,
    })),
    ...(trials ?? []).map((t) => ({
      slug: t.slug,
      title: t.title,
      image_url: t.image_url,
      type: pageTitle('/admin/eureka/trials'),
      editHref: editPath('/admin/eureka/trials', t.slug),
      href: `/eureka/trials/${t.slug}`,
      date: t.updated_at!,
    })),
    ...(outfitSets ?? []).map((o) => ({
      slug: o.slug,
      title: o.title,
      image_url: o.image_url,
      type: pageTitle('/admin/outfits/sets'),
      editHref: editPath('/admin/outfits/sets', o.slug),
      href: outfitSetHref(o.slug),
      date: o.updated_at!,
    })),
    ...(outfitVariants ?? []).map((v) => ({
      slug: v.slug,
      title: v.title ?? toTitle(v.slug),
      image_url: v.image_url,
      type: pageTitle('/admin/outfits/variants'),
      editHref: editPath('/admin/outfits/variants', v.slug),
      href: outfitSetHref(v.outfit_set ?? v.slug),
      date: v.updated_at!,
    })),
    ...(evolutions ?? []).map((e) => ({
      slug: e.slug,
      title: e.title,
      image_url: e.image_url,
      type: pageTitle('/admin/outfits/evolutions'),
      editHref: editPath('/admin/outfits/evolutions', e.slug),
      href: outfitSetHref(e.slug),
      date: e.updated_at!,
    })),
    ...(makeupSets ?? []).map((m) => ({
      slug: m.slug,
      title: m.title,
      image_url: m.image_url,
      type: pageTitle('/admin/makeup/sets'),
      editHref: editPath('/admin/makeup/sets', m.slug),
      href: editPath('/admin/makeup/sets', m.slug),
      date: m.updated_at!,
    })),
    ...(makeupVariants ?? []).map((v) => ({
      slug: v.slug,
      title: v.title ?? toTitle(v.slug),
      image_url: v.image_url,
      type: pageTitle('/admin/makeup/variants'),
      editHref: editPath('/admin/makeup/variants', v.slug),
      href: editPath('/admin/makeup/variants', v.slug),
      date: v.updated_at!,
    })),
    ...(momoCloaks ?? []).map((c) => ({
      slug: c.slug,
      title: c.title,
      image_url: c.image_url,
      type: pageTitle('/admin/momo-cloaks'),
      editHref: editPath('/admin/momo-cloaks', c.slug),
      href: editPath('/admin/momo-cloaks', c.slug),
      date: c.updated_at!,
    })),
    ...(seasons ?? []).map((s) => ({
      slug: s.slug,
      title: s.title,
      image_url: s.image_url,
      type: pageTitle('/admin/outfits/seasons'),
      editHref: editPath('/admin/outfits/seasons', s.slug),
      href: `/seasons/${s.slug}`,
      date: s.updated_at!,
    })),
    ...(seasonCategories ?? []).map((c) => ({
      slug: c.slug,
      title: c.title,
      image_url: c.image_url,
      type: pageTitle('/admin/outfits/season-categories'),
      editHref: editPath('/admin/outfits/season-categories', c.slug),
      href: editPath('/admin/outfits/season-categories', c.slug),
      date: c.updated_at!,
    })),
    ...(abilities ?? []).map((a) => ({
      slug: a.slug,
      title: a.title,
      image_url: a.image_url,
      type: pageTitle('/admin/outfits/abilities'),
      editHref: editPath('/admin/outfits/abilities', a.slug),
      href: editPath('/admin/outfits/abilities', a.slug),
      date: a.updated_at!,
    })),
  ]
})
