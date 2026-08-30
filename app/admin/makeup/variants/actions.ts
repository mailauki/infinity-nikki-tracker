'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
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
 * `makeup_variants.alt_slug` stores exactly that title-derived form for
 * set-owned rows (kept current by trg_set_makeup_variant_alt_slug), so the
 * standalone candidate slug can be looked up against it.
 *
 * Returns an error message naming the owning set, or null when unique.
 * Pass `excludeId` when editing so a row never collides with itself.
 */
async function findSetOwnedDuplicate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  {
    makeup_set,
    makeup_category,
    title,
    excludeId,
  }: {
    makeup_set: string | null
    makeup_category: string | null
    title: string | null
    excludeId?: number
  }
) {
  // Only standalone pieces need this check — a set-owned variant is already
  // covered by the unique index on alt_slug.
  if (makeup_set && makeup_set !== STANDALONE_SLUG) return null
  const titleSlug = toSlug(title ?? '')
  if (!titleSlug || !makeup_category) return null

  let query = supabase
    .from('makeup_variants')
    .select('slug, makeup_set')
    .eq('alt_slug', `${titleSlug}-${makeup_category}`)
  if (excludeId !== undefined) query = query.neq('id', excludeId)

  const { data } = await query.limit(1).maybeSingle()
  if (!data) return null

  return `"${title}" already exists in the set "${data.makeup_set}" (${data.slug}). Edit that variant instead of adding a duplicate standalone piece.`
}

// makeup_set is nullable — a variant with no set is a standalone piece with
// its own title/description/rarity/style. The select's empty-string
// "—" option must be coerced to null here, otherwise it violates the FK.
function readForm(formData: FormData) {
  const rarityRaw = formData.get('rarity') as string | null
  return {
    makeup_set: (formData.get('makeup_set') as string | null) || null,
    makeup_category: (formData.get('makeup_category') as string | null) || null,
    seasons: (formData.get('seasons') as string | null) || null,
    season_category: (formData.get('season_category') as string | null) || null,
    rarity: rarityRaw ? parseInt(rarityRaw, 10) : null,
    style: (formData.get('style') as string | null) || null,
    title: (formData.get('title') as string | null)?.trim() || null,
    description: (formData.get('description') as string | null)?.trim() || null,
    slug: (formData.get('slug') as string | null)?.trim() ?? '',
  }
}

function validate(values: ReturnType<typeof readForm>) {
  if (!values.slug) return 'Slug is required.'
  // A standalone piece (no makeup_set) has nothing else to display, so it
  // must carry its own title.
  if (!values.makeup_set && !values.title) return 'Title is required for a standalone piece.'
  return null
}

export async function addMakeupVariant(_: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const values = readForm(formData)
  const invalid = validate(values)
  if (invalid) return { error: invalid }

  const supabase = await createClient()

  const duplicate = await findSetOwnedDuplicate(supabase, values)
  if (duplicate) return { error: duplicate }

  // Do not write `default` — the enforce_base_makeup_variant_default trigger
  // owns that column and would have its value silently overwritten anyway.
  const { error } = await supabase.from('makeup_variants').insert([values])

  if (error) return { error: error.message }

  if (formData.get('add_another') === 'true')
    return { addAnother: true as const, savedTitle: values.slug }
  redirect(ADMIN_DASHBOARD)
}

export async function editMakeupVariant(id: number, _: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const values = readForm(formData)
  const invalid = validate(values)
  if (invalid) return { error: invalid }

  const supabase = await createClient()

  const duplicate = await findSetOwnedDuplicate(supabase, { ...values, excludeId: id })
  if (duplicate) return { error: duplicate }

  // A category change moves the slug, and the slug is the storage key — so the
  // images have to move with it. recategorizeVariant does the whole move
  // (collision check, storage copy, row update) and returns early; falling
  // through to the plain update below would rewrite the category and leave
  // the old slug in place, stranding every image at the old path.
  //
  // The form does not maintain the slug in edit mode (fields.tsx has no
  // deriveOnEdit, and the slug input stays locked until an admin explicitly
  // unlocks it), so `values.slug` here is normally just the row's existing
  // slug — it cannot be trusted to reflect a category change. The new slug
  // has to be derived server-side with the same helper a fresh add would use.
  //
  // Note: recategorizeVariant copies storage objects BEFORE updating the
  // row, so an { error } return does not mean nothing happened — objects
  // may already exist at the new path. Return it as-is; no rollback here.
  const { data: existing } = await supabase
    .from('makeup_variants')
    .select('slug, makeup_category')
    .eq('id', id)
    .single()

  if (existing && existing.makeup_category !== values.makeup_category) {
    // A cleared category ("—") is falsy but not equal to the old category, so
    // it would otherwise reach deriveVariantSlug/recategorizeVariant below and
    // strand two copied images before the row update fails on the FK to
    // makeup_categories.slug. Reject it before any storage copy happens.
    if (!values.makeup_category) return { error: 'Category is required to recategorize a variant.' }

    const derivedSlug = deriveVariantSlug({
      set: values.makeup_set,
      category: values.makeup_category,
      title: values.title,
    })

    if (derivedSlug !== existing.slug) {
      const result = await recategorizeVariant(
        supabase,
        {
          table: 'makeup_variants',
          obtainedTable: 'obtained_makeup',
          categoryColumn: 'makeup_category',
          variantColumn: 'makeup_variant',
        },
        {
          id,
          currentSlug: existing.slug,
          newSlug: derivedSlug,
          newCategory: values.makeup_category,
        }
      )

      if ('error' in result) return { error: result.error }

      // recategorizeVariant already wrote slug, makeup_category, and the image
      // URL columns — this saves the rest of the form. (readForm does not
      // read image_url/alt_image_url, so the freshly-copied URLs are not at
      // risk from this spread.)
      const rest: Partial<typeof values> = { ...values }
      delete rest.slug
      delete rest.makeup_category
      const { error: restError } = await supabase
        .from('makeup_variants')
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (restError) return { error: restError.message }

      // Always redirect (never honor update_only here): the slug just
      // changed, so the edit page the admin is on no longer resolves, and the
      // form's cached old slug would misdirect a later image upload to the
      // abandoned folder. Send the admin to the new slug's edit page instead.
      revalidatePath(ADMIN_DASHBOARD)
      redirect(`${navLinksData.admin.makeup.variants.edit}/${result.newSlug}`)
    }
  }

  // Do not write `default` — the enforce_base_makeup_variant_default trigger
  // owns that column and would have its value silently overwritten anyway.
  const { error } = await supabase
    .from('makeup_variants')
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  if (formData.get('update_only') === 'true') return { savedTitle: values.slug }

  if (formData.get('update_next') === 'true') {
    const { data: next } = await supabase
      .from('makeup_variants')
      .select('slug')
      .gt('slug', values.slug)
      .order('slug', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (next?.slug) redirect(`${navLinksData.admin.makeup.variants.edit}/${next.slug}`)
    redirect(ADMIN_DASHBOARD)
  }

  redirect(ADMIN_DASHBOARD)
}

export async function deleteMakeupVariant(slug: string) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const supabase = await createClient()
  const { error } = await supabase.from('makeup_variants').delete().eq('slug', slug)
  if (error) return { error: error.message }

  return { success: true }
}

// Lightweight id-keyed update for the DataGrid's inline row-editing (mirrors
// updateOutfitVariant in app/admin/actions.ts).
export async function updateMakeupVariantRow(
  id: number,
  fields: {
    makeup_set?: string | null
    makeup_category?: string | null
    title?: string | null
    rarity?: number | null
    style?: string | null
  }
) {
  const role = await getUserRole()
  if (role !== 'admin') throw new Error('Forbidden')

  const supabase = await createClient()

  // FK columns reject '' — the grid's singleSelect '—' option yields an empty
  // string, so coerce those to null before writing.
  const FK_FIELDS = ['makeup_set', 'makeup_category', 'style'] as const
  const normalized = { ...fields }
  for (const key of FK_FIELDS) {
    if (normalized[key] === '') normalized[key] = null
  }

  const { data, error } = await supabase
    .from('makeup_variants')
    .update({ ...normalized, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
