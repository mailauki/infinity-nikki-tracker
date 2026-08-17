import { redirect } from 'next/navigation'

import { getUserID } from '@/hooks/user'

import { LoginForm } from './login-form'
import { pageTitle } from '@/lib/page-titles'

export const metadata = { title: pageTitle('/login') }

export default async function LoginPage() {
  const user_id = await getUserID()
  if (user_id) redirect('/')

  return <LoginForm />
}
