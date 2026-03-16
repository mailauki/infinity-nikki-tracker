import AuthAppBar from '@/components/navbar/auth-appbar'

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <AuthAppBar />
      {children}
    </>
  )
}
