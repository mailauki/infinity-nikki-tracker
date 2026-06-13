import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ObtainedOutfit } from '@/lib/types/outfit'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json([])
  }

  const { data, error } = await supabase
    .from('obtained_outfit')
    .select('id, outfit_set, outfit_category, evolution')
    .eq('user_id', user.id)

  if (error) {
    console.error('Failed to fetch obtained outfit:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Base variants carry the concrete {outfit_set}-base slug end-to-end; return rows as-is.
  return NextResponse.json((data ?? []) as ObtainedOutfit[])
}
