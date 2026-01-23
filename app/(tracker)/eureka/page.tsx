import EurekaData from "@/components/server-eureka";
import { Suspense } from "react";

export default async function EurekaPage() {
	return (
		<Suspense>
			<EurekaData />
		</Suspense>
	)
}