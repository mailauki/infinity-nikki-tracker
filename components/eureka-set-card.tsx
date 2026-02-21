import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EurekaSet } from '@/lib/types/types'

import EurekaHeader from './eureka-header'

export default function EurekaSetCard({
	eurekaSet,
	user
}: {
	eurekaSet: EurekaSet
	user: boolean
}) {
  return (
    <Card>
      <Button
        className="min-w-xs relative flex h-full w-full flex-1 flex-col items-start justify-between p-0"
        variant="ghost"
        asChild
      >
        <Link href={`/eureka/${eurekaSet.slug}`}>
          <EurekaHeader eurekaSet={eurekaSet} user={user} />
        </Link>
      </Button>
    </Card>
  )
}
