import DashboardNav from './dashboard-nav'

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <DashboardNav />
      {children}
    </>
  )
}
