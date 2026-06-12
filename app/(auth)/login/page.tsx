import { redirect } from 'next/navigation'

import { getUserID } from '@/hooks/user'

import { LoginForm } from './login-form'

export default async function LoginPage() {
  const user_id = await getUserID()
  if (user_id) redirect('/')

  return <LoginForm />
}
