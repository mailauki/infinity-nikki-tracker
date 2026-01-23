import { getEurekaItems } from "@/hooks/get-eureka"
import { getObtained } from "@/hooks/get-obtained"
import { getUser } from "@/hooks/get-user"
import RealtimeEurekaItems from "./realtime-eureka-items"

export default async function EurekaItems() {
	const user = await getUser()
	const obtained = await getObtained(user!)
	const items = await getEurekaItems(obtained!)

	return (
		<>
			<RealtimeEurekaItems
				serverItems={items}
				serverObtained={obtained||[]}
			/>
		</>
	)
}