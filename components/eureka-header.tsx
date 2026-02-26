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
import { count, percent } from '@/hooks/count'
import { EurekaSet } from '@/lib/types/types'

import ProgressBadge from './progress-badge'
import QualityStars from './quality-stars'
import { Progress } from './ui/progress'

export default function EurekaHeader({
  eurekaSet,
  variant = 'default',
  user,
}: {
  eurekaSet: EurekaSet
  variant?: 'default' | 'large'
  user: boolean
}) {
  const obtainedCount = count(eurekaSet.eureka)
  const percentage = percent(obtainedCount.obtained, obtainedCount.total)

  return (
    <Item className="relative w-full">
      <ItemHeader>
        <ItemMedia>
          {eurekaSet.image_url && (
            <Image src={eurekaSet.image_url} alt={eurekaSet.name} width={100} height={100} />
          )}
        </ItemMedia>
      </ItemHeader>
      {variant === 'large' ? (
        <>
          <ItemContent>
            <ItemTitle>{eurekaSet.name}</ItemTitle>
            <ItemDescription>{eurekaSet.trial}</ItemDescription>
          </ItemContent>
          <ItemContent className="text-end">
            <QualityStars quality={eurekaSet.quality!} />
            <ItemDescription>{eurekaSet.style}</ItemDescription>
          </ItemContent>
        </>
      ) : (
        <ItemContent>
          <ItemTitle>{eurekaSet.name}</ItemTitle>
          <QualityStars quality={eurekaSet.quality!} />
        </ItemContent>
      )}
      {user && (
        <ItemFooter className="flex-col">
          <div className="flex w-full flex-1 items-center justify-between gap-2">
            <ProgressBadge percentage={percentage} />
            <ItemTitle className="text-xl">{percentage}%</ItemTitle>
          </div>
          <Progress value={percentage} className="bg-muted" />
        </ItemFooter>
      )}
      <div className="absolute right-2 top-2">
        <Badge variant="outline">{eurekaSet.labels}</Badge>
      </div>
    </Item>
  )
}
