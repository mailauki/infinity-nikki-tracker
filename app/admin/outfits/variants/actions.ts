'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { navLinksData } from '@/lib/nav-links'
import { ADMIN_DASHBOARD, buildDashboardHref } from '@/lib/admin-routes'
import { getUserRole } from '@/hooks/user'
import { getNextGapSlug } from '@/hooks/data/admin/gaps'
import { parseEntityKey, parseGapKind } from '@/lib/admin-entities'

export async function addOutfitVariant(_: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const supabase = await createClient()

  const outfit_set = (formData.get('outfit_set') as string | null) || null
  const outfit_category = (formData.get('outfit_category') as string | null) || null
  const seasons = (formData.get('seasons') as string | null) || null
  const season_category = (formData.get('season_category') as string | null) || null
  const rarityRaw = parseInt(formData.get('rarity') as string)
  const rarity = isNaN(rarityRaw) ? null : rarityRaw
  const style = (formData.get('style') as string | null) || null
  const label = (formData.get('label') as string | null) || null
  const label_2 = (formData.get('label_2') as string | null) || null
  const title = (formData.get('title') as string | null)?.trim() || null
  const description = (formData.get('description') as string | null)?.trim() || null
  const slug = (formData.get('slug') as string | null)?.trim() ?? ''

  if (!slug) return { error: 'Slug is required.' }

  // `default` is intentionally omitted: the trg_enforce_base_variant_default
  // trigger derives it from the owning set's order on every insert/update.
  const { error } = await supabase.from('outfit_variants').insert([
    {
      outfit_set,
      outfit_category,
      seasons,
      season_category,
      rarity,
      style,
      label,
      label_2,
      title,
      description,
      slug,
    },
  ])

  if (error) return { error: error.message }

  if (formData.get('add_another') === 'true') return { addAnother: true as const, savedTitle: slug }
  redirect(ADMIN_DASHBOARD)
}

export async function editOutfitVariant(id: number, _: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const supabase = await createClient()

  const outfit_set = (formData.get('outfit_set') as string | null) || null
  const outfit_category = (formData.get('outfit_category') as string | null) || null
  const seasons = (formData.get('seasons') as string | null) || null
  const season_category = (formData.get('season_category') as string | null) || null
  const rarityRaw = parseInt(formData.get('rarity') as string)
  const rarity = isNaN(rarityRaw) ? null : rarityRaw
  const style = (formData.get('style') as string | null) || null
  const label = (formData.get('label') as string | null) || null
  const label_2 = (formData.get('label_2') as string | null) || null
  const title = (formData.get('title') as string | null)?.trim() || null
  const description = (formData.get('description') as string | null)?.trim() || null
  const slug = (formData.get('slug') as string | null)?.trim() ?? ''

  if (!slug) return { error: 'Slug is required.' }

  // `default` is intentionally omitted — see the note in addOutfitVariant. The
  // trigger still fires here because `outfit_set` is part of every update.
  const { error } = await supabase
    .from('outfit_variants')
    .update({
      outfit_set,
      outfit_category,
      seasons,
      season_category,
      rarity,
      style,
      label,
      label_2,
      title,
      description,
      slug,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  if (formData.get('update_only') === 'true') return { savedTitle: slug }

  // Queue params arrive only from the dashboard's "Start fixing" link. Without
  // them this stays the alphabetical walk from the 2026-06-22 update-and-next
  // spec — guard on presence, not truthiness, so the shipped behavior is intact.
  const entityParam = parseEntityKey(formData.get('entity'))
  const gapParam = formData.get('gap') ? parseGapKind(formData.get('gap')) : null
  const pageParam = Number.parseInt(String(formData.get('page') ?? '1'), 10)
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1

  if (formData.get('update_next') === 'true') {
    if (entityParam && gapParam) {
      const nextSlug = await getNextGapSlug({ entity: entityParam, gap: gapParam, afterSlug: slug })
      if (nextSlug) {
        redirect(
          `${navLinksData.admin.outfits.variants.edit}/${nextSlug}?entity=${entityParam}&gap=${gapParam}&page=${page}`
        )
      }
      redirect(buildDashboardHref({ entity: entityParam, gap: gapParam, page }))
    }

    const { data: next } = await supabase
      .from('outfit_variants')
      .select('slug')
      .gt('slug', slug)
      .order('slug', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (next?.slug) redirect(`${navLinksData.admin.outfits.variants.edit}/${next.slug}`)
    redirect(ADMIN_DASHBOARD)
  }

  // Plain save: back to the queue position if we came from it, else the dashboard.
  redirect(buildDashboardHref({ entity: entityParam, gap: gapParam, page }))
}
