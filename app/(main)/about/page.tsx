import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="flex w-full flex-1 flex-col gap-8 px-6 py-8">
      <section className="flex max-w-2xl flex-col gap-3">
        <h1 className="text-2xl font-semibold">About</h1>
        <p className="text-muted-foreground">
          Infinity Nikki Tracker is a collection tracker for{' '}
          <a
            href="https://infinitynikki.infoldgames.com/"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            Infinity Nikki
          </a>
          , the cozy open-world fashion game. Track your Eureka outfit progress across sets,
          categories, colors, and trials — with real-time updates and per-user collection state.
        </p>
      </section>

      <section className="flex max-w-2xl flex-col gap-3">
        <h2 className="text-lg font-semibold">How to use</h2>
        <ol className="text-muted-foreground flex flex-col gap-2 list-decimal pl-5">
          <li>
            Browse all Eureka sets from the{' '}
            <Link href="/eureka" className="underline underline-offset-4">
              Eureka
            </Link>{' '}
            page.
          </li>
          <li>Sign in to enable collection tracking for your account.</li>
          <li>Open any set and click individual items to mark them as obtained.</li>
          <li>
            Use the{' '}
            <Link href="/eureka/missing" className="underline underline-offset-4">
              Missing
            </Link>{' '}
            view to see items you haven&apos;t collected yet.
          </li>
          <li>
            Use the{' '}
            <Link href="/eureka/trials" className="underline underline-offset-4">
              Trials
            </Link>{' '}
            view to see your progress grouped by in-game trial.
          </li>
        </ol>
      </section>

      <section className="flex max-w-2xl flex-col gap-3">
        <h2 className="text-lg font-semibold">Links &amp; Resources</h2>
        <ul className="text-muted-foreground flex flex-col gap-2 list-disc pl-5">
          <li>
            <a
              href="https://infinity-nikki.fandom.com/"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              Infinity Nikki Wiki
            </a>
          </li>
          <li>
            <a
              href="https://infinitynikki.infoldgames.com/"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              Infinity Nikki Official Website
            </a>
          </li>
          <li>
            <a
              href="https://github.com/mailauki/infinity-nikki-tracker"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              GitHub Repository
            </a>
          </li>
        </ul>
      </section>
      <section className="flex max-w-2xl flex-col gap-3">
        <h2 className="text-lg font-semibold">Collaborate</h2>
        <p className="text-muted-foreground">
          This project is open source. Contributions are welcome — whether it&apos;s fixing a bug,
          improving the UI, or adding new data.
        </p>
        <ul className="text-muted-foreground flex flex-col gap-2 list-disc pl-5">
          <li>
            <a
              href="https://github.com/mailauki/infinity-nikki-tracker"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              View the source on GitHub
            </a>
          </li>
          <li>
            <a
              href="https://github.com/mailauki/infinity-nikki-tracker/issues"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              Open an issue
            </a>{' '}
            for bugs or feature requests
          </li>
          <li>
            <a
              href="https://github.com/mailauki/infinity-nikki-tracker/pulls"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              Submit a pull request
            </a>
          </li>
        </ul>
        <p className="text-muted-foreground">
          The backend runs on{' '}
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            Supabase
          </a>
          . To run the project locally you&apos;ll need your own Supabase project and a{' '}
          <code className="bg-muted rounded px-1 py-0.5 text-xs">.env.local</code> file with{' '}
          <code className="bg-muted rounded px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code>{' '}
          and{' '}
          <code className="bg-muted rounded px-1 py-0.5 text-xs">
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
          </code>
          . Both values are available in your{' '}
          <a
            href="https://supabase.com/dashboard/project/_?showConnect=true"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            Supabase project&apos;s API settings
          </a>
          .
        </p>
      </section>

      <section className="flex max-w-2xl flex-col gap-3">
        <h2 className="text-lg font-semibold">Feedback &amp; Support</h2>
        <p className="text-muted-foreground">
          Found a bug or have a suggestion? Reach out via email —{' '}
          <a href="mailto:julie.ux.dev@gmail.com" className="underline underline-offset-4">
            julie.ux.dev@gmail.com
          </a>
          .
        </p>
				<Button asChild
				className='w-fit font-semibold'
            variant="default"
          >
            <a
          href="https://patreon.com/mailauki"
          target="_blank"
          rel="noreferrer"
        >
          Support on Patreon
        </a>
          </Button>
      </section>
      <p className="text-muted-foreground/60 max-w-2xl text-xs">
        &copy; {new Date().getFullYear()} mailauki. Not affiliated with Infold Games or Infinity
        Nikki.
      </p>
    </div>
  )
}
