import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { ObtainedEureka } from '@/lib/types/eureka'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json([])
  }

  const { data } = await supabase
    .from('obtained_eureka')
    .select('id, eureka_set, category, color')
    .eq('user_id', user.id)

  return NextResponse.json((data ?? []) as ObtainedEureka[])
}
