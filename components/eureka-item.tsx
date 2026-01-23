import { getEurekaItem } from "@/hooks/get-eureka"
import { getObtained } from "@/hooks/get-obtained"
import { getUser } from "@/hooks/get-user"
import EurekaCard from "./eureka-card"
import { EurekaTable } from "./eureka-table"

export default async function EurekaItem({ slug }: { slug: string }) {
	const user = await getUser()
	const obtained = await getObtained(user!)
  const item = await getEurekaItem(slug, obtained!)
	return (
		<>
			<EurekaCard
				eureka={item!}
			/>
			<EurekaTable
				eureka={item!}
			/>
		</>
	)
}