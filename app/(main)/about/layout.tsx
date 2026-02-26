export default function AboutLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto">
      <div className="p-4 pb-16">{children}</div>
    </div>
  )
}
