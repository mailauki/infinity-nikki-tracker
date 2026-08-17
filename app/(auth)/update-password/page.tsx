import { UpdatePasswordForm } from './update-password-form'
import { pageTitle } from '@/lib/page-titles'

export const metadata = { title: pageTitle('/update-password') }

export default function UpdatePasswordPage() {
  return <UpdatePasswordForm />
}
