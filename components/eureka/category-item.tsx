import { countObtained, percent } from '@/hooks/count-obtained'
import { AvatarSize, CategoryType } from '@/lib/types/props'
import { Category, Color, EurekaVariant } from '@/lib/types/eureka'
import { Chip } from '@mui/material'
import EurekaCardProgress from './eureka-card-progress'
import CategoryImage from './category-image'

export function CategoryItem({
  item,
  eurekaVariants,
  categoryType = 'categories',
  size = 'sm',
}: {
  item: Category | Color
  eurekaVariants: EurekaVariant[]
  categoryType?: CategoryType
  size?: AvatarSize
}) {
  const filteredVariants = eurekaVariants.filter(
    (variant) => (categoryType === 'colors' ? variant.color : variant.category) === item.slug
  )
  const obtainedCount = countObtained(filteredVariants)
  const percentage = percent(obtainedCount.obtained, obtainedCount.total)

  return (
    <>
      <CategoryImage
        action={
          <Chip
            label={`${obtainedCount.obtained} / ${obtainedCount.total}`}
            size="small"
            variant="outlined"
          />
        }
        alt={item.title ?? ''}
        imageUrl={item.image_url!}
        size={size}
        subheader={`${percentage}%`}
        title={item.title ?? undefined}
      />
      <EurekaCardProgress percentage={percentage} size="sm" />
    </>
  )
}
