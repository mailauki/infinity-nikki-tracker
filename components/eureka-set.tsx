import { getEurekaSet } from "@/hooks/get-eureka"
import { getObtained } from "@/hooks/get-obtained"
import { getUser } from "@/hooks/get-user"
import RealtimeEurekaSet from "./realtime-eureka-set"

export default async function EurekaSet({ slug }: { slug: string }) {
	const user = await getUser()
	const obtained = await getObtained(user!)
  const eurekaSet = await getEurekaSet(slug, obtained!)
	return (
		<>
			<RealtimeEurekaSet
				serverEurekaSet={eurekaSet!}
				serverObtained={obtained||[]}
			/>
		</>
	)
}