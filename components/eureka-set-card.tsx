import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link";
import EurekaHeader from "./eureka-header";
import { EurekaSet } from "@/lib/types/types";

export default function EurekaSetCard({ eurekaSet }: { eurekaSet: EurekaSet }) {
  return (
    <Card>
			<Button className="relative flex flex-col flex-1 min-w-xs w-full h-full justify-between items-start p-0" variant="ghost" asChild>
				<Link href={`/eureka/${eurekaSet.slug}`}>
					<EurekaHeader eurekaSet={eurekaSet} />
				</Link>
			</Button>
    </Card>
  )
}
