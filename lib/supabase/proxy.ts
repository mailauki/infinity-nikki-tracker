import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Only these prefixes require a session. Everything else — the landing page,
  // the public collection browsers, the auth pages themselves — is readable
  // logged out and must NOT pay for an auth check.
  //
  // This is deliberately a protected-list, not a public-list. It used to be the
  // inverse: gate everything, then subtract a growing set of public exceptions.
  // That default silently broke each new public domain until someone remembered
  // to add it — /makeup and /momo-cloaks were both public pages that redirected
  // anonymous visitors to /login because they were never added. Listing what to
  // protect fails closed on the thing that matters (a new gated route is an
  // explicit entry) and fails open on the harmless one.
  //
  // /u/[username] stays public: profiles are viewable by anyone and the page
  // hides owner-only affordances itself. /profile is protected — it resolves
  // the signed-in user's handle, so it has nothing to show a logged-out visitor.
  const PROTECTED_PREFIXES = ['/admin', '/profile', '/settings', '/looks']
  const needsAuth = PROTECTED_PREFIXES.some(
    (p) => request.nextUrl.pathname === p || request.nextUrl.pathname.startsWith(`${p}/`)
  )

  // An anonymous visitor to a public route has no session to validate OR
  // refresh, so the round-trip is pure latency — skip it.
  //
  // The cookie check is what makes this safe. A LOGGED-IN user on a public page
  // must still go through getUser(): public pages read the user (getUserID) to
  // show collection progress, and getUser() is also what refreshes an expiring
  // token. Returning early for them would let sessions lapse mid-browse and log
  // them out — the failure mode the notes above and below warn about. Only
  // requests carrying no Supabase auth cookie take the shortcut.
  const hasSessionCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('auth-token'))

  if (!needsAuth && !hasSessionCookie) return supabaseResponse

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: Do not use getClaims() here. It decodes the JWT locally without
  // a network round-trip, but it can silently return null when the session cookie
  // format doesn't match (e.g. after a signOut + signIn cycle). getUser() makes
  // a real API call, handles token refresh, and is the only reliable guard.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // No user: this request is rejected either way. Only the SHAPE of the
    // rejection depends on the request kind — the auth decision above never
    // does, so the client-settable Next-Action header cannot be used to slip
    // an unauthenticated request past this gate.
    //
    // A Server Action POST cannot be answered with NextResponse.redirect:
    // Next signals an action redirect via an `x-action-redirect` header on the
    // action's own RSC-flight response, so a bare 307 is not a valid action
    // response and React's client runtime reports it as "An unexpected
    // response was received from the server". Return an explicit 401 instead,
    // which the client surfaces as a real error rather than a corrupt payload.
    if (request.method === 'POST' && request.headers.has('next-action')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
