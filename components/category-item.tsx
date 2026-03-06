import { countObtained, percent } from '@/hooks/count'
import { AvatarSize, CategoryType } from '@/lib/types/props'
import { Category, EurekaVariant } from '@/lib/types/eureka'
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
    (variant) => (categoryType === 'colors' ? variant.color : variant.category) === item.title
  )
  const obtainedCount = countObtained(filteredVariants)
  const percentage = percent(obtainedCount.obtained, obtainedCount.total)

  return (
    <>
      <CategoryImage
        imageUrl={item.image_url!}
        alt={item.title}
        action={
          <Chip
            label={`${obtainedCount.obtained} / ${obtainedCount.total}`}
            variant="outlined"
            size="small"
          />
        }
        title={item.title}
        subheader={`${percentage}%`}
        size={size}
      />
      <EurekaCardProgress percentage={percentage} size="sm" />
    </>
  )
}
