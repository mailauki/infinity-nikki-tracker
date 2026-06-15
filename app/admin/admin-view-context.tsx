'use client'

import { createClient } from '@/lib/supabase/client'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type View = 'list' | 'table'

const AdminViewContext = createContext<{
  view: View
  setView: (v: View) => void
  // Ephemeral (session-only) toggle for the per-category variant image columns
  // in the outfit set and evolution admin tables. Defaults to hidden so those
  // wide grids load clean.
  showVariantColumns: boolean
  setShowVariantColumns: (v: boolean) => void
}>({
  view: 'list',
  setView: () => {},
  showVariantColumns: false,
  setShowVariantColumns: () => {},
})

export function AdminViewProvider({
  initialView,
  userId,
  children,
}: {
  initialView: View
  userId: string
  children: React.ReactNode
}) {
  const [view, setView] = useState(initialView)
  const [showVariantColumns, setShowVariantColumns] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const channel = supabase
      .channel('admin-view-channel')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin_preferences',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const next = payload.new.admin_view as View
          if (next) setView(next)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return (
    <AdminViewContext value={{ view, setView, showVariantColumns, setShowVariantColumns }}>
      {children}
    </AdminViewContext>
  )
}

export function useAdminView() {
  return useContext(AdminViewContext)
}
