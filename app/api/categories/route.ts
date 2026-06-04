import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { EurekaCategory } from '@/lib/types/eureka'

export async function GET() {
  const supabase = await createClient()

  const { data: categories, error } = await supabase
    .from('eureka_categories')
    .select('slug, title, image_url')
    .order('id', { ascending: true })

  if (error) {
    console.error('Failed to fetch categories:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json((categories ?? []) as EurekaCategory[])
}
