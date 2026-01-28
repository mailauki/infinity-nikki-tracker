import { SparkleIcon } from 'lucide-react'

export default function QualityStars({ quality }: { quality: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: quality }, (_, index) => (
        <SparkleIcon
          key={index}
          color="var(--card-foreground)"
          fill="var(--card-foreground)"
          size={14}
        />
      ))}
    </div>
  )
}
