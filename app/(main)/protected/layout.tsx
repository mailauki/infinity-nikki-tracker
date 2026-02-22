export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-1 flex-col items-center gap-20">
      <div className="flex max-w-5xl flex-1 flex-col gap-20 p-5">{children}</div>

      <footer className="mx-auto flex w-full items-center justify-center gap-8 border-t py-16 text-center text-xs">
        <p>
          Powered by{' '}
          <a
            href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
            target="_blank"
            className="font-bold hover:underline"
            rel="noreferrer"
          >
            Supabase
          </a>
        </p>
      </footer>
    </div>
  )
}
