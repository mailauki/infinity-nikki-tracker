import { NextResponse } from 'next/server'
import { getUserID } from '@/hooks/user'
import { getObtainedMakeup } from '@/hooks/data/obtained-makeup'

export async function GET() {
  const userId = await getUserID()
  if (!userId) return NextResponse.json([])

  try {
    return NextResponse.json(await getObtainedMakeup(userId))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch obtained makeup'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
