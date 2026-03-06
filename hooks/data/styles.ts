import { createClient } from "@/lib/supabase/server"
import { Style } from "@/lib/types/eureka"
import { cache } from "react"

export const getStyles = cache(async () => {
  const supabase = await createClient()

  const { data: styles } = await supabase
    .from('styles')
    .select('title')
    .not('title', 'is', null)
    .order('title', { ascending: true })

  return styles as Style[]
})