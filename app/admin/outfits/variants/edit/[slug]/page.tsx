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
import { editOutfitVariant } from '../../actions'

export const metadata: Metadata = {
  title: 'Edit Outfit Variant',
}

export default async function EditOutfitVariantPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditOutfitVariant params={params} />
      </Stack>
    </Suspense>
  )
}

async function EditOutfitVariant({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

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
        glowupSetTitle: glowupSet.title,
      }) ?? ''
  }

  return (
    <EntityForm
      showUpdateNext
      showUpdateOnly
      action={editOutfitVariant.bind(null, variant.id)}
      formId="edit-outfit-variant"
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
        default: variant.default,
      }}
      lookups={{ outfitSets, outfitCategories, seasons, seasonCategories, styles, labels }}
      mode="edit"
    />
  )
}
