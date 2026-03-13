import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { Color } from '@/lib/types/eureka'

export async function GET() {
  const supabase = await createClient()

  const { data: colors } = await supabase
    .from('colors')
    .select('slug, title, image_url')
    .order('id', { ascending: true })

  return NextResponse.json((colors ?? []) as Color[])
}
