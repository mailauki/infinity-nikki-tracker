import { Eureka } from "@/lib/types/types";

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Image from "next/image";
import { SparkleIcon } from "lucide-react";
import { percent } from "@/hooks/count";
import ProgressBadge from "./progress-badge";
import Link from "next/link";
import { getObtainedEureka } from "@/hooks/get-obtained-count";

export default function EurekaCard({
	eureka,
}: {
	eureka: Eureka,
}) {
	const obtainedEureka = getObtainedEureka(eureka)
	const percentage = obtainedEureka ? percent(obtainedEureka!.obtained, obtainedEureka!.total) : 0

  return (
    <Card>
			<Button className="relative flex flex-col flex-1 min-w-xs w-full h-full justify-between items-start" variant="ghost" asChild>
				<Link href={`/eureka/${eureka.slug}`}>
					<CardHeader className="w-full p-4 pb-0">
						<Image
							src={eureka.image_url}
							alt={eureka.name}
							width={100}
							height={100}
						/>
						<CardTitle>{eureka.name}</CardTitle>
					</CardHeader>
					<CardContent className="w-full p-4 flex flex-col gap-4">
						<div className="flex items-center gap-1">
							{Array.from({ length: eureka.quality }, (_, index) => (
								<SparkleIcon
									key={index}
									color="var(--card-foreground)"
									fill="var(--card-foreground)"
									size={14}
								/>
							))}
						</div>
						{obtainedEureka && (
							<div className="flex justify-between gap-2">
								<ProgressBadge percentage={percentage} />
								<CardDescription>{percentage}%</CardDescription>
							</div>
						)}
					</CardContent>
					<div className="absolute right-2 top-2">
						<Badge variant="outline">{eureka.labels}</Badge>
					</div>
				</Link>
			</Button>
    </Card>
  )
}
