import { Color } from '@/lib/types/eureka'
import { createClient } from '@/lib/supabase/server'

export async function getColors() {
	const supabase = await createClient()

  const { data: colors } = await supabase
    .from('colors')
    .select('title, image_url')
    .order('id', { ascending: true })

  return colors as Color[]
}
