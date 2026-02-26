import { Check } from 'lucide-react'
import Image from 'next/image'

import { handleObtained } from '@/app/(main)/eureka/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Eureka } from '@/lib/types/types'

export default function EurekaButton({ eureka, user }: { eureka: Eureka; user: boolean }) {
  const slugEurekaSet = eureka.eureka_set!.replace(' ', '_')
  const slug = `${slugEurekaSet}-${eureka.category}-${eureka.color}`

  return (
    <>
      <Card key={eureka.id} className={`${eureka.obtained === true ? 'bg-background' : 'bg-card'} overflow-clip`}>
        <Button
          variant="ghost"
          onClick={() => handleObtained(slug)}
          className="relative h-full w-full"
          disabled={!user}
        >
          {eureka.image_url && <Image src={eureka.image_url} alt={slug} width={100} height={100} />}
          <div className="absolute bottom-2 left-2">
            <Badge variant="outline">
              {eureka.category}
              {' • '}
              {eureka.color}
            </Badge>
          </div>
          <div className="absolute left-2 top-2">
            <Badge variant="outline">{eureka.eureka_set}</Badge>
          </div>
          <div className="absolute right-2 top-2">
            {eureka.obtained === true && (
              <Badge className="rounded-full p-1" variant="outline">
                <Check className="size-4" strokeWidth={3} />
              </Badge>
            )}
          </div>
        </Button>
      </Card>
    </>
  )
}
