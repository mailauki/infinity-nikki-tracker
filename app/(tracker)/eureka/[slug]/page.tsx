import { Suspense } from "react"
import { getEurekaSet, getObtained } from "@/lib/data"
import RealtimeEurekaSet from "@/components/realtime-eureka-set"
import { getUserID } from "@/hooks/user"

export async function generateStaticParams() {
  return [{ slug: 'hello-world' }]
}

export default async function EurekaSetPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <div className="flex flex-col p-6 gap-6">
			<Suspense>
				<EurekaSet slug={slug} />
			</Suspense>
    </div>
  )
}

async function EurekaSet({ slug }: { slug: string }) {
	const eurekaSet = await getEurekaSet(slug)
	const user_id = await getUserID()
	const obtained = await getObtained(user_id!)

	return (
		<RealtimeEurekaSet
			serverEurekaSet={eurekaSet}
			serverObtained={obtained||[]}
		/>
	)
}