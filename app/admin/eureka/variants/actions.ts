'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { toSlugVariant } from '@/lib/utils'
import { navLinksData } from '@/lib/nav-links'
import { ADMIN_DASHBOARD, buildDashboardHref } from '@/lib/admin-routes'
import { getUserRole } from '@/hooks/user'
import { getNextGapSlug } from '@/hooks/data/admin/gaps'
import { parseEntityKey, parseGapKind } from '@/lib/admin-entities'

export async function addEurekaVariant(_: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const supabase = await createClient()

  const eureka_set = (formData.get('eureka_set') as string | null) || null
  const category = (formData.get('category') as string | null) || null
  const color = (formData.get('color') as string | null) || null
  const image_url = (formData.get('image_url') as string | null) || null
  const isDefault = formData.get('default') === 'true'
  const slug =
    (formData.get('slug') as string | null)?.trim() ||
    toSlugVariant(eureka_set ?? '', category ?? '', color ?? '')

  const { error } = await supabase
    .from('eureka_variants')
    .insert([{ eureka_set, category, color, image_url, default: isDefault, slug }])

  if (error) return { error: error.message }

  if (formData.get('add_another') === 'true') return { addAnother: true as const, savedTitle: slug }
  redirect(ADMIN_DASHBOARD)
}

export async function editEurekaVariant(id: number, _: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const supabase = await createClient()

  const eureka_set = (formData.get('eureka_set') as string | null) || null
  const category = (formData.get('category') as string | null) || null
  const color = (formData.get('color') as string | null) || null
  const image_url = (formData.get('image_url') as string | null) || null
  const isDefault = formData.get('default') === 'true'
  const slug =
    (formData.get('slug') as string | null)?.trim() ||
    toSlugVariant(eureka_set ?? '', category ?? '', color ?? '')

  const { error } = await supabase
    .from('eureka_variants')
    .update({
      eureka_set,
      category,
      color,
      image_url,
      default: isDefault,
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
          `${navLinksData.admin.eureka.variants.edit}/${nextSlug}?entity=${entityParam}&gap=${gapParam}&page=${page}`
        )
      }
      redirect(buildDashboardHref({ entity: entityParam, gap: gapParam, page }))
    }

    const { data: next } = await supabase
      .from('eureka_variants')
      .select('slug')
      .gt('slug', slug)
      .order('slug', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (next?.slug) redirect(`${navLinksData.admin.eureka.variants.edit}/${next.slug}`)
    redirect(ADMIN_DASHBOARD)
  }

  // Plain save: back to the queue position if we came from it, else the dashboard.
  redirect(buildDashboardHref({ entity: entityParam, gap: gapParam, page }))
}
