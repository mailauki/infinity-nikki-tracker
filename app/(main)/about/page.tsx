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
        <h2 className="text-lg font-semibold">Feedback &amp; Support</h2>
        <p className="text-muted-foreground">
          Found a bug or have a suggestion? Reach out via email —{' '}
          <a href="mailto:mailauki@gmail.com" className="underline underline-offset-4">
            mailauki@gmail.com
          </a>
          .
        </p>
        <a
          href="https://patreon.com/mailauki"
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-2 rounded-md bg-[#FF424D] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Support on Patreon
        </a>
      </section>
    </div>
  )
}
