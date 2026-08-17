import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { pageTitle } from '@/lib/page-titles'

export const metadata: Metadata = {
  title: pageTitle('/profile'),
}

// /profile is a permalink to the signed-in user's own public profile: it resolves
// their username and forwards to /u/[username], which renders the page for owner
// and visitor alike. Keeping the route means existing links and the nav entry
// don't need to know the handle.
export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  // Every profile gets a generated username at signup, so this is only reachable
  // if the row is missing entirely — send them to settings rather than 404.
  if (!profile?.username) redirect('/settings')

  redirect(`/u/${profile.username}`)
}
