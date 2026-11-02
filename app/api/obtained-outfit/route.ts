import { NextResponse } from 'next/server'
import { getUserID } from '@/hooks/user'
import { getObtainedOutfit } from '@/hooks/data/obtained-outfit'

export async function GET() {
  const userId = await getUserID()
  if (!userId) return NextResponse.json([])

  try {
    // Reads every page (PostgREST caps a single response at 1000 rows).
    const obtainedOutfit = await getObtainedOutfit(userId)
    return NextResponse.json(obtainedOutfit)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch obtained outfit'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
