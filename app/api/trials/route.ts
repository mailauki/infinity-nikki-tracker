import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { Trial } from '@/lib/types/eureka'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('trials')
    .select('id, slug, title, image_url, updated_at')
    .order('id', { ascending: true })

  if (error) {
    console.error('Failed to fetch trials:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json((data ?? []) as Trial[])
}
