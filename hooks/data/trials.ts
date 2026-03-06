import { createClient } from "@/lib/supabase/server"
import { Trial } from "@/lib/types/eureka"
import { cache } from "react"

export const getTrials = cache(async () => {
	const supabase = await createClient()

	const { data: trials } = await supabase
		.from('trials')
		.select('id, slug, title, image_url, updated_at')
		.order('id', { ascending: true })

	return trials as Trial[]
})