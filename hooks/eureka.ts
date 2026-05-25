import { Category, Color, EurekaVariant, EurekaSet, ObtainedEureka } from '@/lib/types/eureka'

function colorRank(slug: string | null, defaultColorSlug: string | null | undefined): number {
  if (slug === defaultColorSlug) return -1
  if (slug === 'iridescent') return 1
  return 0
}

export function sortVariants(
  variants: EurekaVariant[],
  defaultColorSlug: string | null | undefined,
  categoryOrder: string[]
): EurekaVariant[] {
  return [...variants].sort((a, b) => {
    const colorDiff = colorRank(a.color, defaultColorSlug) - colorRank(b.color, defaultColorSlug)
    if (colorDiff !== 0) return colorDiff
    if (a.color !== b.color) return 0
    return categoryOrder.indexOf(a.category ?? '') - categoryOrder.indexOf(b.category ?? '')
  })
}

export function createEurekaSet({
  eurekaSet,
  categories,
  colors,
}: {
  eurekaSet: Omit<EurekaSet, 'created_at' | 'image_url' | 'categories' | 'colors'>
  categories: Category[] | null
  colors: Color[] | null
}) {
  const defaultColorSlug = eurekaSet.eureka_variants.find((v) => v.default)?.color
  const categoryOrder = (categories ?? []).map((c) => c.slug)
  const colorSlugs = [...new Set(eurekaSet.eureka_variants.map((v) => v.color))]
  const resolvedColors = colorSlugs
    .flatMap((slug) => colors?.filter((c) => c.slug === slug) ?? [])
    .sort((a, b) => colorRank(a.slug, defaultColorSlug) - colorRank(b.slug, defaultColorSlug))

  const eureka = {
    ...eurekaSet,
    image_url: eurekaSet.eureka_variants.find((variant) => variant.default)?.image_url,
    categories: categories,
    colors: resolvedColors,
    eureka_variants: sortVariants(
      eurekaSet.eureka_variants as EurekaVariant[],
      defaultColorSlug,
      categoryOrder
    ),
  } as EurekaSet

  return eureka
}

export function updateEurekaSet({
  eurekaSet,
  obtainedEureka,
}: {
  eurekaSet: EurekaSet
  obtainedEureka: ObtainedEureka[] | null
}) {
  const eurekaWithObtained = {
    ...eurekaSet,
    eureka_variants: eurekaSet?.eureka_variants.map((variant) => ({
      ...variant,
      obtained: !!obtainedEureka?.find(
        (obtained) =>
          variant.eureka_set === obtained.eureka_set &&
          variant.category === obtained.category &&
          variant.color === obtained.color
      ),
    })) as EurekaVariant[],
  } as EurekaSet

  return eurekaWithObtained
}

export function updateEurekaVariants({
  eurekaVariants,
  obtainedEureka,
}: {
  eurekaVariants: EurekaVariant[]
  obtainedEureka: ObtainedEureka[] | null
}) {
  const eurekaWithObtained = eurekaVariants.map((variant) => ({
    ...variant,
    obtained: !!obtainedEureka?.find(
      (obtained) =>
        variant.eureka_set === obtained.eureka_set &&
        variant.category === obtained.category &&
        variant.color === obtained.color
    ),
  })) as EurekaVariant[]

  return eurekaWithObtained
}
