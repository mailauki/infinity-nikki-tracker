import { Suspense } from 'react'
import { getUserID, getUserRole } from '@/hooks/user'
import MakeupDataProvider from './makeup-data-provider'
import { MakeupImageModeProvider } from '@/components/makeup/makeup-image-mode-context'
import { SortProvider } from '@/components/sort-context'
import MakeupLoading from './loading'

async function MakeupProviders({ children }: { children: React.ReactNode }) {
  const [userId, role] = await Promise.all([getUserID(), getUserRole()])

  return (
    <SortProvider isLoggedIn={!!userId}>
      <MakeupDataProvider isAdmin={role === 'admin'} isLoggedIn={!!userId} userId={userId}>
        <MakeupImageModeProvider isLoggedIn={!!userId}>{children}</MakeupImageModeProvider>
      </MakeupDataProvider>
    </SortProvider>
  )
}

export default function MakeupLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<MakeupLoading />}>
      <MakeupProviders>{children}</MakeupProviders>
    </Suspense>
  )
}
