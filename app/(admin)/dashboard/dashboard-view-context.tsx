'use client'

import { createClient } from '@/lib/supabase/client'
import { createContext, useContext, useEffect, useState } from 'react'

type View = 'list' | 'table'

const DashboardViewContext = createContext<{ view: View; setView: (v: View) => void }>({
  view: 'list',
  setView: () => {},
})

const supabase = createClient()

export function DashboardViewProvider({
  initialView,
  userId,
  children,
}: {
  initialView: View
  userId: string
  children: React.ReactNode
}) {
  const [view, setView] = useState(initialView)

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-view-channel')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_preferences',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const next = payload.new.dashboard_view as View
          if (next) setView(next)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return <DashboardViewContext value={{ view, setView }}>{children}</DashboardViewContext>
}

export function useDashboardView() {
  return useContext(DashboardViewContext)
}
