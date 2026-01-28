import { Category, Eureka, EurekaSet, EurekaSets, Obtained } from '@/lib/types/types'

export function createEurekaSet({
  eurekaSet,
  categories,
  colors,
}: {
  eurekaSet: EurekaSets | null
  categories: Category[] | null
  colors: Category[] | null
}) {
  const eureka = {
    ...eurekaSet,
    image_url: eurekaSet?.eureka.find((item) => item.default)?.image_url,
    categories: categories,
    colors: [...new Set(eurekaSet?.eureka.map((item) => item.color))].flatMap((item) =>
      colors?.filter((color) => color.name === item)
    ),
  } as EurekaSet

  return eureka
}

export function updateEurekaSet({
  eurekaSet,
  obtained,
}: {
  eurekaSet: EurekaSet
  obtained: Obtained[] | null
}) {
  const eurekaWithObtained = {
    ...eurekaSet,
    eureka: eurekaSet?.eureka.map((item) => ({
      ...item,
      obtained: !!obtained?.find(
        (value) =>
          item.eureka_set === value.eureka_set &&
          item.category === value.category &&
          item.color === value.color
      ),
    })) as Eureka[],
  } as EurekaSet

  return eurekaWithObtained
}

// export function isObtained({
// 	slug, obtained,
// } : {
// 	slug: string,
// 	obtained: Obtained[]|null
// }) {
// 	const splitSlug = slug.split("-")
// 	const eureka = splitSlug[0].replace("_", " ")
// 	const category = splitSlug[1]
// 	const color = splitSlug[2]

// 	return obtained?.find((item) => item.eureka_set === eureka && item.color === color && item.category === category) ? true : false
// }
