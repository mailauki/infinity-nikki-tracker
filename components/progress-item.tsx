// 'use client'

import { countObtained, percent } from '@/hooks/count'
import { Category, CategoryType, EurekaVariant } from '@/lib/types/types'
import { Card, CardActionArea } from '@mui/material'
import CardHeader from './card-header'

export function ProgressItem({
  item,
  eurekaVariants,
  categoryType,
  value,
  onValueChange,
}: {
  item: Category
  eurekaVariants: EurekaVariant[]
  categoryType: CategoryType
  value?: string
  onValueChange?: (value: string) => void
}) {
  const filteredVariants = eurekaVariants.filter(
    (variant) => (categoryType === 'colors' ? variant.color : variant.category) === item.name
  )
  const obtainedCount = countObtained(categoryType ? filteredVariants : eurekaVariants)
  const percentage = percent(obtainedCount.obtained, obtainedCount.total)
  const isSelected = value === item.name

  return (
    <Card elevation={0} component="li">
      {!!onValueChange ? (
        <CardActionArea
          onClick={() => onValueChange?.(isSelected ? '' : item.name)}
          data-active={isSelected === true ? '' : undefined}
          sx={{
            height: '100%',
            '&[data-active]': {
              backgroundColor: 'action.selected',
              '&:hover': {
                backgroundColor: 'action.selectedHover',
              },
            },
          }}
        >
          <CardHeader
            image={item.image_url}
            title={item.name}
            subheader={`${percentage}%`}
            chip={`${obtainedCount.obtained} / ${obtainedCount.total}`}
            percentage={percentage}
            categoryType={categoryType}
          />
        </CardActionArea>
      ) : (
        <CardHeader
          image={item.image_url}
          title={item.name}
          subheader={`${percentage}%`}
          chip={`${obtainedCount.obtained} / ${obtainedCount.total}`}
          percentage={percentage}
          categoryType={categoryType}
        />
      )}
    </Card>
  )
}
