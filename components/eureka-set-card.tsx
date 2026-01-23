import { EurekaSet } from "@/lib/types/types";

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import { SparkleIcon } from "lucide-react";
import { percent } from "@/hooks/count";
import ProgressBadge from "./progress-badge";
import Link from "next/link";
import { getObtainedSetCount } from "@/hooks/get-obtained-count";
import EurekaHeader from "./eureka-header";

export default function EurekaSetCard({
	eurekaSet,
}: {
	eurekaSet: EurekaSet,
}) {
	const obtainedSetCount = getObtainedSetCount(eurekaSet)
	const percentage = obtainedSetCount ? percent(obtainedSetCount!.obtained, obtainedSetCount!.total) : 0

  return (
    <Card>
			<Button className="relative flex flex-col flex-1 min-w-xs w-full h-full justify-between items-start" variant="ghost" asChild>
				<Link href={`/eureka/${eurekaSet.slug}`}>
					{/* <CardHeader className="w-full p-4 pb-0">
						<Image
							src={eurekaSet.image_url}
							alt={eurekaSet.name}
							width={100}
							height={100}
						/>
						<CardTitle>{eurekaSet.name}</CardTitle>
					</CardHeader> */}
					<EurekaHeader name={eurekaSet.name} image={eurekaSet.image_url} />
					<CardContent className="w-full p-4 flex flex-col gap-4">
						<div className="flex items-center gap-1">
							{Array.from({ length: eurekaSet.quality }, (_, index) => (
								<SparkleIcon
									key={index}
									color="var(--card-foreground)"
									fill="var(--card-foreground)"
									size={14}
								/>
							))}
						</div>
						{obtainedSetCount && (
							<div className="flex justify-between gap-2">
								<ProgressBadge percentage={percentage} />
								<CardDescription>{percentage}%</CardDescription>
							</div>
						)}
					</CardContent>
					<div className="absolute right-2 top-2">
						<Badge variant="outline">{eurekaSet.labels}</Badge>
					</div>
				</Link>
			</Button>
    </Card>
  )
}
