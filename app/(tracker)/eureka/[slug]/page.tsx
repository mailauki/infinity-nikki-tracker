import { Suspense } from "react"
import EurekaItem from "@/components/eureka-item"

export async function generateStaticParams() {
  return [{ slug: 'hello-world' }]
}

export default async function EurekaItemPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <div className="flex flex-col p-6 gap-6">
			<Suspense>
				<h1 className="capitalize">{slug}</h1>
				<EurekaItem slug={slug} />
			</Suspense>
    </div>
  )
}