import { createClient } from '@/lib/supabase/server'
import { Label } from '@/lib/types/eureka'

export async function getLabels() {
	const supabase = await createClient()

  const { data: labels } = await supabase
    .from('labels')
    .select('title')
    .not('title', 'is', null)
    .order('title', { ascending: true })

  return labels as Label[]
}
