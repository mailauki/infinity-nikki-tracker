import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { getOutfitSetsRaw } from '@/hooks/data/admin/outfit-sets'
import { getOutfitCategories } from '@/hooks/data/outfit-categories'
import { getOutfitVariantRaw, getBaseVariantTitle } from '@/hooks/data/admin/outfit-variants'
import { getSeasons } from '@/hooks/data/seasons'
import { getSeasonCategories } from '@/hooks/data/season-categories'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import { deriveGlowupVariantTitle, isGlowup } from '@/hooks/outfit'
import EntityForm from '@/app/admin/entity-form'
import { parseEntityKey, parseGapKind } from '@/lib/admin-entities'
import { editOutfitVariant } from '../../actions'

export const metadata: Metadata = {
  title: 'Edit Outfit Variant',
}

type SearchParams = Promise<{ entity?: string; gap?: string; page?: string }>

export default function EditOutfitVariantPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: SearchParams
}) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditOutfitVariant params={params} searchParams={searchParams} />
      </Stack>
    </Suspense>
  )
}

async function EditOutfitVariant({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: SearchParams
}) {
  const { slug } = await params
  const { entity: rawEntity, gap: rawGap, page: rawPage } = await searchParams
  const entity = parseEntityKey(rawEntity)
  const gap = rawGap ? parseGapKind(rawGap) : null
  const page = Number.parseInt(rawPage ?? '1', 10)

  const [variant, outfitSets, outfitCategories, seasons, seasonCategories, styles, labels] =
    await Promise.all([
      getOutfitVariantRaw(slug),
      getOutfitSetsRaw(),
      getOutfitCategories(),
      getSeasons(),
      getSeasonCategories(),
      getStyles(),
      getLabels(),
    ])

  if (!variant) notFound()

  // For a glow-up variant with no stored title, pre-fill the Title field with
  // "{base variant title}: {glow-up set title}". Persisted only when the admin
  // saves — nothing is written here.
  let prefillTitle = variant.title ?? ''
  const glowupSet = outfitSets.find((s) => s.slug === variant.outfit_set)
  if (!prefillTitle.trim() && glowupSet && isGlowup(glowupSet) && glowupSet.base_set) {
    const baseVariantTitle = await getBaseVariantTitle(
      glowupSet.base_set,
      variant.outfit_category ?? ''
    )
    prefillTitle =
      deriveGlowupVariantTitle({
        baseVariantTitle,
        glowupSubtitle: glowupSet.subtitle,
      }) ?? ''
  }

  const formId = 'edit-outfit-variant'

  return (
    <>
      <EntityForm
        showUpdateNext
        showUpdateOnly
        action={editOutfitVariant.bind(null, variant.id)}
        formId={formId}
        formKind="outfitVariant"
        initialValues={{
          outfit_set: variant.outfit_set ?? '',
          outfit_category: variant.outfit_category ?? '',
          seasons: variant.seasons ?? '',
          season_category: variant.season_category ?? '',
          rarity: variant.rarity ?? '',
          style: variant.style ?? '',
          label: variant.label ?? '',
          label_2: variant.label_2 ?? '',
          title: prefillTitle,
          description: variant.description ?? '',
          slug: variant.slug,
          image_url: variant.image_url,
          image_url_alt: variant.alt_image_url,
        }}
        lookups={{ outfitSets, outfitCategories, seasons, seasonCategories, styles, labels }}
        mode="edit"
      />
      {entity && <input form={formId} name="entity" type="hidden" value={entity} />}
      {gap && <input form={formId} name="gap" type="hidden" value={gap} />}
      {entity && (
        <input
          form={formId}
          name="page"
          type="hidden"
          value={Number.isFinite(page) && page > 0 ? page : 1}
        />
      )}
    </>
  )
}
