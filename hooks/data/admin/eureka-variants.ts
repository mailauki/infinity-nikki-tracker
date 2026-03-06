import { createClient } from "@/lib/supabase/server"
import { EurekaVariantRaw } from "@/lib/types/eureka"
import { cache } from "react"

export const getEurekaVariantsRaw = cache(async () => {
  const supabase = await createClient()

  const { data: eurekaVariants } = await supabase
    .from('eureka_variants')
    .select(
      `
			id,
			slug,
			eureka_set,
			color,
			category,
			image_url,
			default,
			updated_at
			`
    )
    .order('id', { ascending: true })

  return eurekaVariants as EurekaVariantRaw[]
})

export const getEurekaVariantRaw = cache(async (slug: string) => {
	const supabase = await createClient()

	const { data: eurekaVariant } = await supabase
    .from('eureka_variants')
    .select(
      `
			id,
			slug,
			eureka_set,
			color,
			category,
			image_url,
			default,
			updated_at
			`
    )
    .eq('slug', slug)
    .maybeSingle()

		return eurekaVariant as EurekaVariantRaw
})