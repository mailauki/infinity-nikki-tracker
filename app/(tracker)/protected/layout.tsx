export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
		<div className="flex-1 w-full flex flex-col gap-20 items-center">
			<div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
				{children}
			</div>

			<footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
				<p>
					Powered by{" "}
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
  );
}
