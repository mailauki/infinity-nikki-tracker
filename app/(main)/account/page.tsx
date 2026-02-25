import AccountForm from '@/components/account-form'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

export default function AccountPage() {
  return (
    <div className="flex w-full flex-1 flex-col gap-12">
      <Suspense>
        <UserDetails />
      </Suspense>
    </div>
  )
}

async function UserDetails() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (error || !data?.claims) {
    redirect('/auth/login')
  }

  return (
    <div className="flex w-full flex-col items-start gap-2 py-4">
      <AccountForm user={user} />
    </div>
  )
}
