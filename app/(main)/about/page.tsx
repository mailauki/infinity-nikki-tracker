import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="flex w-full flex-1 flex-col gap-8 px-6 pb-8">
      <section className="flex max-w-2xl flex-col gap-3">
        <h1 className="text-3xl !leading-tight md:text-4xl">About</h1>
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
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-muted-foreground">
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
        <ul className="flex list-disc flex-col gap-2 pl-5 text-muted-foreground">
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
        <h2 className="text-lg font-semibold">Roadmap</h2>
        <p className="text-muted-foreground">Planned features and improvements:</p>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-muted-foreground">
          <li>More outfit types — expand tracking beyond Eureka sets</li>
          <li>Item search — search across all items globally</li>
          <li>Admin dashboard — manage backend data directly from the frontend</li>
        </ul>
      </section>

      <section className="flex max-w-2xl flex-col gap-3">
        <h2 className="text-lg font-semibold">Collaborate</h2>
        <p className="text-muted-foreground">
          This project is open source. Contributions are welcome — whether it&apos;s fixing a bug,
          improving the UI, or adding new data.
        </p>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-muted-foreground">
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
          . Data can be manually added from the dashboard, found in the{' '}
          <a
            href="https://supabase.com/dashboard/project/ykfuevyqpjvtxidjnhxm"
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
        <div className="flex gap-2">
          <Button asChild className="w-fit font-semibold" variant="default">
            <a href="https://patreon.com/mailauki" target="_blank" rel="noreferrer">
              Support on Patreon
            </a>
          </Button>
          <Button asChild className="w-fit font-semibold" variant="outline">
            <a href="https://buymeacoffee.com/mailauki" target="_blank" rel="noreferrer">
              Buy Me a Coffee
            </a>
          </Button>
        </div>
      </section>
      <p className="text-muted-foreground/60 max-w-2xl text-xs">
        &copy; 2026 mailauki. Not affiliated with Infold Games or Infinity Nikki.
      </p>
    </div>
  )
}
