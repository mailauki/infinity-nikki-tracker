import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
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

  if (error || !data?.claims) {
    redirect('/auth/login')
  }

  return (
    <div className="flex max-w-sm flex-col items-start gap-2">
      <Field data-disabled>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input id="email" type="email" placeholder="Email" value={data.claims.email} disabled />
      </Field>
    </div>
  )
}
