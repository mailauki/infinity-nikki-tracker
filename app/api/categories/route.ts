import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { Category } from '@/lib/types/eureka'

export async function GET() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('slug, title, image_url')
    .order('id', { ascending: true })

  return NextResponse.json((categories ?? []) as Category[])
}
