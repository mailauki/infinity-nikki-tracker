import Image from 'next/image'

import { Badge } from '@/components/ui/badge'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import { Progress } from '@/components/ui/progress'
import { count, percent } from '@/hooks/count'
import { Eureka, Total } from '@/lib/types/types'

export default function ProgressCard({
  item,
  imageSize = 60,
  eureka,
}: {
  item: Total
  imageSize?: number
  eureka: Eureka[]
}) {
  const hasObtained = Object.keys(eureka[0]).includes('obtained') // used to determine if user is logged in or not
  const obtainedCount = count(eureka)
  const percentage = percent(obtainedCount.obtained, obtainedCount.total)

  return (
    <Item
      key={item.name}
      variant="outline"
      className={`${
        item.name === 'Iridescent'
          ? 'order-last col-start-3 row-start-1 row-end-3 md:col-start-5 md:row-end-1'
          : ''
      } relative w-full flex-col justify-between rounded-xl text-left`}
    >
      {item.image_url && (
        <ItemHeader className="flex-0 w-full">
          <ItemMedia className={imageSize > 300 ? 'w-full' : 'w-fit'}>
            <Image
              src={item.image_url}
              alt={item.name!}
              width={imageSize}
              height={imageSize}
              className={
                imageSize === 60 ? 'brightness-[0.4] grayscale dark:filter-none' : 'filter-none'
              }
            />
          </ItemMedia>
        </ItemHeader>
      )}
      <ItemContent className="flex-0 w-full grow">
        <ItemDescription>{item.name}</ItemDescription>
        {hasObtained && <ItemTitle className="text-lg">{percentage}%</ItemTitle>}
      </ItemContent>
      {hasObtained && (
        <ItemFooter className="flex-0 w-full">
          <Progress value={percentage} className="bg-muted" />
        </ItemFooter>
      )}
      <div className="absolute right-2 top-2">
        {hasObtained && (
          <Badge variant="outline">
            {obtainedCount.obtained}/{obtainedCount.total}
          </Badge>
        )}
      </div>
    </Item>
  )
}
