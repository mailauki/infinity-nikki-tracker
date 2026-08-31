'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function deleteAccount() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(user.id)

  if (error) throw new Error(error.message)

  await supabase.auth.signOut()
  redirect('/')
}

// Whether the signed-in user has a password set.
//
// The JS client's User type has no has_password field, and inferring it from
// the presence of an 'email' identity is wrong — automatic linking can attach
// an email identity to an account that never had a password. Reading
// auth.users directly is the only exact answer, and being exact is the whole
// point of the unlink guard that consumes this.
//
// `.schema('auth')` can't typecheck here — the generated Database type only
// covers the public and graphql_public schemas — so this reads auth.users
// through the current_user_has_password() RPC instead (see migration
// 20260830130000). That RPC reads auth.uid() from the caller's own JWT, so
// it needs no service-role client and takes no user-id argument at all.
export async function getHasPassword(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  // current_user_has_password() isn't in the generated Database type (the
  // types are regenerated from the schema and this RPC is new), so the call
  // is cast through this one RPC client shape rather than widening the
  // whole Supabase client to `any`.
  const rpc = supabase.rpc as unknown as (
    fn: 'current_user_has_password'
  ) => Promise<{ data: boolean | null; error: { message: string } | null }>
  const { data, error } = await rpc('current_user_has_password')

  if (error) throw new Error(error.message)

  return Boolean(data)
}
