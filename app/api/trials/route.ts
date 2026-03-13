import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { Trial } from '@/lib/types/eureka'

export async function GET() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('trials')
    .select('id, slug, title, image_url, updated_at')
    .order('id', { ascending: true })

  return NextResponse.json((data ?? []) as Trial[])
}
