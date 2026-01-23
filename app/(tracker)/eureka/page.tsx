import EurekaSets from "@/components/eureka-sets";
import { Suspense } from "react";

export default async function EurekaSetsPage() {
	return (
		<Suspense>
			<EurekaSets />
		</Suspense>
	)
}