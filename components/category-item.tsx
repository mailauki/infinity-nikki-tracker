import { countObtained, percent } from '@/hooks/count'
import { AvatarSize, Category, CategoryType, EurekaVariant } from '@/lib/types/types'
import { Chip } from '@mui/material'
import EurekaCardProgress from './eureka/eureka-card-progress'
import CategoryImage from './category-image'

export function CategoryItem({
  item,
  eurekaVariants,
  categoryType = 'categories',
  size = 'sm',
}: {
  item: Category
  eurekaVariants: EurekaVariant[]
  categoryType?: CategoryType
  size?: AvatarSize
}) {
  const filteredVariants = eurekaVariants.filter(
    (variant) => (categoryType === 'colors' ? variant.color : variant.category) === item.name
  )
  const obtainedCount = countObtained(filteredVariants)
  const percentage = percent(obtainedCount.obtained, obtainedCount.total)

  return (
    <>
      <CategoryImage
        imageUrl={item.image_url!}
        alt={item.name}
        action={
          <Chip
            label={`${obtainedCount.obtained} / ${obtainedCount.total}`}
            variant="outlined"
            size="small"
          />
        }
        title={item.name}
        subheader={`${percentage}%`}
        size={size}
      />
      <EurekaCardProgress percentage={percentage} size="sm" />
    </>
  )
}
