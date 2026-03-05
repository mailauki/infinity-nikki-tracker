import { createClient } from '@/lib/supabase/client'

export async function handleObtained(slug: string) {
  const splitSlug = slug.split('-')
  const eureka_set = splitSlug[0].split('_').join(' ')
  const category = splitSlug[1]
  const color = splitSlug[2]

  const supabase = createClient()

  const { error } = await supabase.rpc('toggle_obtained', {
    p_eureka_set: eureka_set,
    p_category: category,
    p_color: color,
  })

  if (error) console.log(error)
}
