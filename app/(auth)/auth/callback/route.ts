import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

import { safeNext } from '@/lib/auth-redirect'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  // A provider can also redirect back with an error instead of a code (the
  // user hit "Cancel" on the consent screen, most commonly).
  const providerError = searchParams.get('error_description') ?? searchParams.get('error')
  if (providerError) {
    redirect(`/auth/error?error=${encodeURIComponent(providerError)}`)
  }

  if (!code) {
    redirect(`/auth/error?error=${encodeURIComponent('No code provided')}`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    redirect(`/auth/error?error=${encodeURIComponent(error.message)}`)
  }

  // `origin` comes from the request, not NEXT_PUBLIC_SITE_URL, so a Vercel
  // preview deployment redirects to itself rather than to production.
  redirect(`${origin}${next}`)
}
