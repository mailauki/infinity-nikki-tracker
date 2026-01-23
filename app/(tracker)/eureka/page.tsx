import EurekaItems from "@/components/eureka-items";
import { Suspense } from "react";

export default async function EurekaPage() {
	return (
		<Suspense>
			<EurekaItems />
		</Suspense>
	)
}