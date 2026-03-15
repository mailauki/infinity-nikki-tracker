import { Category, EurekaVariant, EurekaSet, ObtainedEureka, Color } from '@/lib/types/eureka'

export function createEurekaSet({
  eurekaSet,
  categories,
  colors,
}: {
  eurekaSet: Omit<EurekaSet, 'created_at' | 'image_url' | 'categories' | 'colors'> | null
  categories: Category[] | null
  colors: Color[] | null
}) {
  const eureka = {
    ...eurekaSet,
    image_url: eurekaSet?.eureka_variants.find((variant) => variant.default)?.image_url,
    categories: categories,
    colors: [...new Set(eurekaSet?.eureka_variants.map((variant) => variant.color))].flatMap(
      (colorSlug) => colors?.filter((color) => color.slug === colorSlug)
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
