import { Badge } from '@/components/ui/badge'

export default function ProgressBadge({ percentage }: { percentage: number }) {
  return (
    <Badge
      variant={percentage === 100 ? 'default' : 'secondary'}
      className="text-md flex w-fit gap-1 rounded-lg"
    >
      {percentage === 100 ? 'Complete' : 'Unfinished'}
    </Badge>
  )
}
