import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { getOutfitSetsRaw } from '@/hooks/data/admin/outfit-sets'
import { getOutfitCategories } from '@/hooks/data/outfit-categories'
import {
  getOutfitVariantRaw,
  getBaseVariantTitle,
  getGlowupBaseOptions,
} from '@/hooks/data/admin/outfit-variants'
import { getInheritedRelease } from '@/hooks/data/admin/inherited-release'
import { getSeasons } from '@/hooks/data/seasons'
import { getSeasonCategories } from '@/hooks/data/season-categories'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import { deriveGlowupVariantTitle, isGlowup } from '@/hooks/outfit'
import EntityForm from '@/app/admin/entity-form'
import { editOutfitVariant } from '../../actions'
import { pageTitle } from '@/lib/sitemap/routes'

export const metadata: Metadata = {
  title: pageTitle('/admin/outfits/variants/edit/[slug]'),
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

  const [
    variant,
    outfitSets,
    outfitCategories,
    seasons,
    seasonCategories,
    styles,
    labels,
    glowupBaseOptions,
  ] = await Promise.all([
    getOutfitVariantRaw(slug),
    getOutfitSetsRaw(),
    getOutfitCategories(),
    getSeasons(),
    getSeasonCategories(),
    getStyles(),
    getLabels(),
    getGlowupBaseOptions(),
  ])

  if (!variant) notFound()

  // A piece can't be its own glow-up.
  const glowupBases = glowupBaseOptions.filter((o) => o.slug !== variant.slug)

  const inheritedRelease = await getInheritedRelease('outfitVariant', slug)

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

  return (
    <EntityForm
      showUpdateNext
      showUpdateOnly
      action={editOutfitVariant.bind(null, variant.id)}
      builderData={{ inheritedRelease }}
      formId="edit-outfit-variant"
      formKind="outfitVariant"
      initialValues={{
        outfit_set: variant.outfit_set ?? '',
        outfit_category: variant.outfit_category ?? '',
        seasons: variant.seasons ?? '',
        season_category: variant.season_category ?? '',
        rarity: variant.rarity ?? '',
        glowup_of: variant.glowup_of ?? '',
        style: variant.style ?? '',
        label: variant.label ?? '',
        label_2: variant.label_2 ?? '',
        title: prefillTitle,
        description: variant.description ?? '',
        slug: variant.slug,
        image_url: variant.image_url,
        image_url_alt: variant.alt_image_url,
        released_at: variant.released_at ?? '',
        version: variant.version ?? '',
      }}
      lookups={{
        outfitSets,
        outfitCategories,
        seasons,
        seasonCategories,
        styles,
        labels,
        glowupBases,
      }}
      mode="edit"
    />
  )
}
