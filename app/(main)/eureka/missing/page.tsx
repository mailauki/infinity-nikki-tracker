import { Suspense } from 'react'

import { getEurekaSets } from '@/lib/data'
import EurekaFilter from '@/components/eureka-filter'
import { getUserID } from '@/hooks/user'

export default async function MissingPage() {
  return (
    <Suspense>
      <Missing />
    </Suspense>
  )
}

async function Missing() {
  const eurekaSets = await getEurekaSets()
  const categories = [...new Set(eurekaSets.flatMap((eurekaSet) => eurekaSet.categories))]
  const eureka = eurekaSets.flatMap((eurekaSet) => eurekaSet.eureka)
  const hasObtained = Object.keys(eureka[0]).includes('obtained') // used to determine if user is logged in or not
	const user_id = await getUserID()
	const user = !!(user_id!)

  if (!user)
    return (
      <div className="mt-10 flex flex-col items-center">
        <p className="max-w-sm text-center text-2xl">
          Sign in or Sign up <br />
          to track your missing Eureka
        </p>
      </div>
    )
  return <EurekaFilter eureka={eureka} categories={categories} />
}
