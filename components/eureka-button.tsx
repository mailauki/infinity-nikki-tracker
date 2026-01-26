import { handleObtained } from "@/app/(tracker)/eureka/actions";
import { Button } from "@/components/ui/button";
import { Eureka } from "@/lib/types/types";
import { Check } from "lucide-react";
import Image from "next/image"
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function EurekaButton({
	eureka, hasObtained,
} : {
	eureka: Eureka,
	hasObtained: boolean,
}) {
	const slugEurekaSet = eureka.eureka_set!.replace(" ", "_")
	const slug = `${slugEurekaSet}-${eureka.category}-${eureka.color}`

	return (
		<>
			<Card key={eureka.id} className={`${(eureka.obtained === true) ? "bg-background": "bg-card"}`}>
				<Button
					variant="ghost"
					onClick={() => handleObtained(slug)}
					className="w-full h-full relative"
					disabled={!hasObtained}
				>
					{eureka.image_url && (
						<Image
							src={eureka.image_url}
							alt={slug}
							width={100}
							height={100}
						/>
					)}
					<div className="absolute left-2 bottom-2">
						<Badge variant="outline">
							{eureka.category}{" • "}{eureka.color}
						</Badge>
					</div>
					<div className="absolute right-2 top-2">
						{(eureka.obtained === true) && (
							<Badge className="p-1 rounded-full" variant="outline">
								<Check className="size-4" strokeWidth={3} />
							</Badge>
						)}
					</div>
				</Button>
			</Card>
		</>
	)
}