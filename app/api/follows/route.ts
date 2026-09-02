import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// A route handler rather than a Server Action, deliberately.
//
// A Server Action that sets cookies — which the Supabase SSR client does
// whenever it refreshes a session — marks its response revalidated, which
// invalidates the client router cache. On /u/[username] that re-runs ~10
// sequential collection queries per follow toggle. See lib/save-preferences.ts,
// which exists for the same reason on the preferences path.
export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  let body: { targetId?: unknown; action?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Malformed body' }, { status: 400 })
  }

  const { targetId, action } = body

  if (typeof targetId !== 'string' || (action !== 'follow' && action !== 'unfollow')) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  // The follower is always the caller, re-derived server-side. It is never read
  // from the request, so a caller cannot act as another user. RLS enforces this
  // too; this is the cheaper, clearer rejection.
  if (targetId === user.id) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
  }

  if (action === 'follow') {
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: user.id, following_id: targetId })

    // 23505 is a unique/PK violation: the row we wanted already exists, so the
    // caller's intent is already satisfied. Treating it as success makes a
    // double-click idempotent instead of an error toast.
    if (error && error.code !== '23505') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ following: true })
  }

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', targetId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ following: false })
}
