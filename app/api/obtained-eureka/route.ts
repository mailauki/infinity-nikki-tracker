import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { ObtainedEureka } from '@/lib/types/eureka'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.error('Auth error in obtained-eureka route:', authError)
    return NextResponse.json({ error: authError.message }, { status: 401 })
  }

  if (!user) {
    return NextResponse.json([])
  }

  const { data, error } = await supabase
    .from('obtained_eureka')
    .select('id, eureka_set, category, color')
    .eq('user_id', user.id)

  if (error) {
    console.error('Failed to fetch obtained eureka:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json((data ?? []) as ObtainedEureka[])
}
