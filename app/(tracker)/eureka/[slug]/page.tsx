import { Suspense } from "react"
import EurekaSet from "@/components/eureka-set"

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
				<h1 className="capitalize">{slug}</h1>
				<EurekaSet slug={slug} />
			</Suspense>
    </div>
  )
}