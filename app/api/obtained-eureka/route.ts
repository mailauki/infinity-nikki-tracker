import { NextResponse } from 'next/server'
import { getUserID } from '@/hooks/user'
import { getObtainedEureka } from '@/hooks/data/obtained-eureka'

export async function GET() {
  const userId = await getUserID()
  if (!userId) return NextResponse.json([])

  try {
    return NextResponse.json(await getObtainedEureka(userId))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch obtained eureka'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
