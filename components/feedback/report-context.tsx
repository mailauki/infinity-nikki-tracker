'use client'

import { createContext, useContext } from 'react'

// Optional enrichment only. The footer link derives route and slug on its own;
// a detail page that already knows the entity's display name can publish it
// here so the report reads "Blossoming Dream" instead of "blossoming_dream".
// Nothing breaks when no provider is present.
const ReportSubjectContext = createContext<string | null>(null)

export function ReportSubjectProvider({
  title,
  children,
}: {
  title: string | null
  children: React.ReactNode
}) {
  return <ReportSubjectContext.Provider value={title}>{children}</ReportSubjectContext.Provider>
}

export function useReportSubject(): string | null {
  return useContext(ReportSubjectContext)
}
