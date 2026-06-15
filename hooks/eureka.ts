import {
  EurekaCategory,
  EurekaColor,
  EurekaVariant,
  EurekaSet,
  ObtainedEureka,
} from '@/lib/types/eureka'
import { toSlugVariant } from '@/lib/utils'

// Build an O(1) membership Set of obtained variants keyed by
// `${set}-${category}-${color}`. Lets callers resolve `obtained` without the
// O(variants × obtained) `.find` that updateEurekaSet/updateEurekaVariants run.
export function buildObtainedKeySet(obtainedEureka: ObtainedEureka[] | null): Set<string> {
  const keys = new Set<string>()
  for (const o of obtainedEureka ?? []) {
    if (o.eureka_set && o.category && o.color) {
      keys.add(toSlugVariant(o.eureka_set, o.category, o.color))
    }
  }
  return keys
}

// True when this variant is in the obtained key Set (see buildObtainedKeySet).
export function isVariantObtained(variant: EurekaVariant, obtainedKeys: Set<string>): boolean {
  if (!variant.eureka_set || !variant.category || !variant.color) return false
  return obtainedKeys.has(toSlugVariant(variant.eureka_set, variant.category, variant.color))
}

// Materialize `.obtained` on every variant of every set via an O(1) Set lookup.
// Replaces the per-render updateEurekaSet().map() that did O(variants × obtained)
// `.find` calls and re-allocated the whole tree on every render; callers memoize
// this on [eurekaSets, obtainedKeys] so it only recomputes when data changes.
export function applyObtainedKeys(
  eurekaSets: EurekaSet[],
  obtainedKeys: Set<string>
): EurekaSet[] {
  return eurekaSets.map((set) => ({
    ...set,
    eureka_variants: set.eureka_variants.map((variant) => ({
      ...variant,
      obtained: isVariantObtained(variant, obtainedKeys),
    })) as EurekaVariant[],
  })) as EurekaSet[]
}

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
  categories: EurekaCategory[] | null
  colors: EurekaColor[] | null
}) {
  const defaultColorSlug = eurekaSet.eureka_variants.find((v) => v.default)?.color
  const categoryOrder = (categories ?? []).map((c) => c.slug)
  const colorSlugs = [...new Set(eurekaSet.eureka_variants.map((v) => v.color))]
  const resolvedColors = colorSlugs
    .flatMap((slug) => colors?.filter((c) => c.slug === slug) ?? [])
    .sort((a, b) => colorRank(a.slug, defaultColorSlug) - colorRank(b.slug, defaultColorSlug))

  const eureka = {
    ...eurekaSet,
    image_url: (
      eurekaSet.eureka_variants.find((v) => v.default && v.category === 'head') ??
      eurekaSet.eureka_variants.find((v) => v.default)
    )?.image_url,
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
