'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { navLinksData } from '@/lib/nav-links'
import { ADMIN_DASHBOARD } from '@/lib/admin-routes'
import { getUserRole } from '@/hooks/user'
import { toSlug } from '@/lib/utils'
import { recategorizeVariant } from '@/lib/variant-recategorize'
import { deriveVariantSlug } from '@/lib/variant-slug'

const STANDALONE_SLUG = 'standalone_pieces'

/**
 * Guard against re-adding a piece as standalone when it already ships inside a
 * set. A set-owned variant's slug is `{set}-{category}`, but the same piece
 * added standalone would slug to `{toSlug(title)}-{category}` — two different
 * strings for one item, so `slug` alone can't detect the duplicate.
 *
 * `outfit_variants.alt_slug` stores exactly that title-derived form for
 * set-owned rows (kept current by trg_set_outfit_variant_alt_slug), so the
 * standalone candidate slug can be looked up against it.
 *
 * Returns an error message naming the owning set, or null when unique.
 * Pass `excludeId` when editing so a row never collides with itself.
 */
async function findSetOwnedDuplicate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  {
    outfit_set,
    outfit_category,
    title,
    excludeId,
  }: {
    outfit_set: string | null
    outfit_category: string | null
    title: string | null
    excludeId?: number
  }
) {
  // Only standalone pieces need this check — a set-owned variant is already
  // covered by the unique index on alt_slug.
  if (outfit_set && outfit_set !== STANDALONE_SLUG) return null
  const titleSlug = toSlug(title ?? '')
  if (!titleSlug || !outfit_category) return null

  let query = supabase
    .from('outfit_variants')
    .select('slug, outfit_set')
    .eq('alt_slug', `${titleSlug}-${outfit_category}`)
  if (excludeId !== undefined) query = query.neq('id', excludeId)

  const { data } = await query.limit(1).maybeSingle()
  if (!data) return null

  return `"${title}" already exists in the set "${data.outfit_set}" (${data.slug}). Edit that variant instead of adding a duplicate standalone piece.`
}

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

  const duplicate = await findSetOwnedDuplicate(supabase, {
    outfit_set,
    outfit_category,
    title,
  })
  if (duplicate) return { error: duplicate }

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

  const duplicate = await findSetOwnedDuplicate(supabase, {
    outfit_set,
    outfit_category,
    title,
    excludeId: id,
  })
  if (duplicate) return { error: duplicate }

  // A category change moves the slug, and the slug is the storage key — so the
  // images have to move with it. recategorizeVariant does the whole move
  // (collision check, storage copy, row update) and returns early; falling
  // through to the plain update below would rewrite the category and leave
  // the old slug in place, stranding every image at the old path.
  //
  // The form does not maintain the slug in edit mode (fields.tsx has no
  // deriveOnEdit, and the slug input stays locked until an admin explicitly
  // unlocks it), so `slug` here is normally just the row's existing slug —
  // it cannot be trusted to reflect a category change. The new slug has to
  // be derived server-side with the same helper a fresh add would use.
  //
  // Note: recategorizeVariant copies storage objects BEFORE updating the
  // row, so an { error } return does not mean nothing happened — objects
  // may already exist at the new path. Return it as-is; no rollback here.
  const { data: existing } = await supabase
    .from('outfit_variants')
    .select('slug, outfit_category')
    .eq('id', id)
    .single()

  if (existing && existing.outfit_category !== outfit_category) {
    const derivedSlug = deriveVariantSlug({
      set: outfit_set,
      category: outfit_category,
      title,
    })

    if (derivedSlug !== existing.slug) {
      const result = await recategorizeVariant(
        supabase,
        {
          table: 'outfit_variants',
          obtainedTable: 'obtained_outfit',
          categoryColumn: 'outfit_category',
          variantColumn: 'outfit_variant',
        },
        {
          id,
          currentSlug: existing.slug,
          newSlug: derivedSlug,
          newCategory: outfit_category ?? '',
        }
      )

      if ('error' in result) return { error: result.error }

      // recategorizeVariant already wrote slug, outfit_category, and the image
      // URL columns — this saves the rest of the form.
      const { error: restError } = await supabase
        .from('outfit_variants')
        .update({
          outfit_set,
          seasons,
          season_category,
          rarity,
          style,
          label,
          label_2,
          title,
          description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (restError) return { error: restError.message }

      if (formData.get('update_only') === 'true') return { savedTitle: result.newSlug }
      revalidatePath(ADMIN_DASHBOARD)
      redirect(ADMIN_DASHBOARD)
    }
  }

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

  if (formData.get('update_next') === 'true') {
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

  redirect(ADMIN_DASHBOARD)
}
