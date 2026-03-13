import { Category, EurekaVariant, EurekaSet, ObtainedEureka } from '@/lib/types/eureka'

export function createEurekaSet({
  eurekaSet,
  categories,
  colors,
}: {
  eurekaSet: Omit<EurekaSet, 'created_at' | 'image_url' | 'categories' | 'colors'> | null
  categories: Category[] | null
  colors: Category[] | null
}) {
  const eureka = {
    ...eurekaSet,
    image_url: eurekaSet?.eureka_variants.find((item) => item.default)?.image_url,
    categories: categories,
    colors: [...new Set(eurekaSet?.eureka_variants.map((item) => item.color))].flatMap((item) =>
      colors?.filter((color) => color.slug === item)
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
    eureka_variants: eurekaSet?.eureka_variants.map((item) => ({
      ...item,
      obtained: !!obtainedEureka?.find(
        (value) =>
          item.eureka_set === value.eureka_set &&
          item.category === value.category &&
          item.color === value.color
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
  const eurekaWithObtained = eurekaVariants.map((item) => ({
    ...item,
    obtained: !!obtainedEureka?.find(
      (value) =>
        item.eureka_set === value.eureka_set &&
        item.category === value.category &&
        item.color === value.color
    ),
  })) as EurekaVariant[]

  return eurekaWithObtained
}
