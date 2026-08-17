import { ForgotPasswordForm } from './forgot-password-form'
import { pageTitle } from '@/lib/page-titles'

export const metadata = { title: pageTitle('/forgot-password') }

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
