import { redirect } from 'next/navigation'

import { ADMIN_DASHBOARD } from '@/app/admin/form-context'

export default function EditOutfitSetIndexPage() {
  redirect(ADMIN_DASHBOARD)
}
