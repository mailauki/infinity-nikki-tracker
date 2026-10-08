import { SignUpForm } from './sign-up-form'
import { pageTitle } from '@/lib/sitemap/routes'

export const metadata = { title: pageTitle('/sign-up') }

export default function SignupPage() {
  return <SignUpForm />
}
