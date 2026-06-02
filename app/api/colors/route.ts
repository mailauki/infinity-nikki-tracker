import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { EurekaColor } from '@/lib/types/eureka'

export async function GET() {
  const supabase = await createClient()

  const { data: colors, error } = await supabase
    .from('eureka_colors')
    .select('slug, title, image_url')
    .order('id', { ascending: true })

  if (error) {
    console.error('Failed to fetch colors:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json((colors ?? []) as EurekaColor[])
}
