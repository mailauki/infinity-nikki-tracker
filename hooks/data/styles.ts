import { Style } from '@/lib/types/eureka'
import { createClient } from '@/lib/supabase/server'

export async function getStyles() {
	const supabase = await createClient()

  const { data: styles } = await supabase
    .from('styles')
    .select('title')
    .not('title', 'is', null)
    .order('title', { ascending: true })

  return styles as Style[]
}
