import { redirect } from 'next/navigation'

import { ADMIN_DASHBOARD } from '@/lib/admin-routes'

export default function EditOutfitSetIndexPage() {
  redirect(ADMIN_DASHBOARD)
}
