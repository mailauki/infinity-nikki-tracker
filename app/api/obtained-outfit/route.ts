import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getObtainedOutfit } from '@/hooks/data/obtained-outfit'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json([])
  }

  try {
    // Reads every page (PostgREST caps a single response at 1000 rows).
    const obtainedOutfit = await getObtainedOutfit(user.id)
    return NextResponse.json(obtainedOutfit)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch obtained outfit'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
