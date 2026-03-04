import { UUID } from 'crypto'

import { createClient } from '@/lib/supabase/client'

export async function handleObtained(slug: string) {
  const splitSlug = slug.split('-')
  const eureka_set = splitSlug[0].split('_').join(' ')
  const category = splitSlug[1]
  const color = splitSlug[2]

  const supabase = createClient()

  const { data } = await supabase.auth.getClaims()
  const user = data?.claims.user_metadata
  const user_id = <UUID | string>(user ? user.sub : null)

  const { data: existing } = await supabase
    .from('obtained')
    .select('id')
    .eq('user_id', user_id)
    .eq('eureka_set', eureka_set)
    .eq('category', category)
    .eq('color', color)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from('obtained').delete().eq('id', existing.id)
    if (error) console.log(error)
  } else {
    const { data, error } = await supabase
      .from('obtained')
      .insert([{ eureka_set, category, color, user_id }])
      .select('id, eureka_set, category, color')
    if (error) console.log(error)
    return data
  }
}
