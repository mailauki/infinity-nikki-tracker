import { Metadata } from 'next'
import { Link as Anchor } from '@mui/material'
import { Section, SectionList, SectionSubtitle, SectionTitle } from '@/components/section'
import { pageTitle } from '@/lib/page-titles'
import LegalPage from '../legal-page'

export const metadata: Metadata = {
  title: pageTitle('/terms-of-service'),
  description:
    'The terms for using Infinity Nikki Tracker — a free, fan-made, open-source collection tracker.',
}

export default function TermsOfServicePage() {
  return (
    <LegalPage
      summary="This is a free fan project, offered as-is. Be decent, don't abuse it, and understand that a hobby project can change or go away. Support payments are optional and non-refundable once premium is unlocked."
      title={pageTitle('/terms-of-service')}
    >
      <Section>
        <SectionTitle>Agreement</SectionTitle>
        <SectionSubtitle>
          By using Infinity Nikki Tracker you agree to these terms. If you don&apos;t agree, please
          don&apos;t use the app. These terms work alongside our{' '}
          <Anchor color="textSecondary" href="/privacy-policy">
            Privacy Policy
          </Anchor>
          , which explains how your data is handled.
        </SectionSubtitle>
      </Section>

      <Section>
        <SectionTitle>What this service is</SectionTitle>
        <SectionSubtitle>
          A fan-made, open-source tracker that lets you record which Infinity Nikki outfits, Eureka
          pieces, makeup, and cloaks you have collected. It is run by an individual developer as a
          hobby project, not by a company, and it is not affiliated with Papergames or the Infinity
          Nikki development team.
        </SectionSubtitle>
      </Section>

      <Section>
        <SectionTitle>Your account</SectionTitle>
        <SectionList
          bullets={[
            'You must be at least 13 years old to create an account',
            'Provide accurate information and keep your password secure — you are responsible for activity under your account',
            'One person per account; do not share credentials or impersonate someone else',
            'Tell us promptly if you believe your account has been accessed without permission',
          ]}
        />
      </Section>

      <Section>
        <SectionTitle>Acceptable use</SectionTitle>
        <SectionSubtitle>
          The app is small and community-run. Please don&apos;t make it harder to keep running.
        </SectionSubtitle>
        <SectionList
          bullets={[
            'Do not scrape, spider, or send automated traffic that degrades the service for others',
            'Do not attempt to access accounts, data, or admin functions that are not yours',
            'Do not upload unlawful, hateful, harassing, or sexually explicit images to your profile, looks, or feedback reports',
            'Do not use the app to distribute malware, spam, or misleading content',
            'Do not attempt to bypass premium restrictions or interfere with payment processing',
          ]}
        />
      </Section>

      <Section>
        <SectionTitle>Your content</SectionTitle>
        <SectionSubtitle>
          You keep ownership of what you create — your Custom Looks, profile details, and the
          progress you track. You grant us only the permission needed to store and display that
          content back to you, and to show your public profile if you choose to set a username. You
          are responsible for anything you upload, and confirm you have the right to upload it.
        </SectionSubtitle>
      </Section>

      <Section>
        <SectionTitle>Game content and intellectual property</SectionTitle>
        <SectionSubtitle>
          Infinity Nikki, its outfits, artwork, names, and all related assets are the property of
          Papergames and their respective owners. They appear here for identification and reference
          in a non-commercial fan tool. We claim no ownership of them, and we will remove any
          content at the request of its rights holder.
        </SectionSubtitle>
        <SectionSubtitle>
          The tracker&apos;s own source code is open source and available on{' '}
          <Anchor
            color="textSecondary"
            href="https://github.com/mailauki/infinity-nikki-tracker"
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </Anchor>{' '}
          under its stated license.
        </SectionSubtitle>
      </Section>

      <Section>
        <SectionTitle>Payments, premium, and refunds</SectionTitle>
        <SectionList
          bullets={[
            'The core tracker is free. Support payments are voluntary and are treated as a tip, not a purchase',
            'Premium unlocks conveniences such as unlimited Custom Looks and additional color themes — it does not gate your collection data',
            'Payments are processed by Stripe; we never receive or store your card details',
            'Because premium unlocks immediately and permanently, payments are non-refundable except where required by law — if something went wrong with a charge, email us and we will make it right',
            'If premium features change or the app shuts down, previously unlocked premium will not be re-billed',
          ]}
        />
      </Section>

      <Section>
        <SectionTitle>Availability and changes</SectionTitle>
        <SectionSubtitle>
          This is a hobby project maintained in spare time. Features may be added, changed, or
          removed, the app may be unavailable during maintenance or outages, and game data may be
          incomplete or lag behind in-game updates. We do not promise any particular uptime, and we
          may discontinue the service — if we do, we will give reasonable notice so you can export
          your data.
        </SectionSubtitle>
      </Section>

      <Section>
        <SectionTitle>Accuracy of game data</SectionTitle>
        <SectionSubtitle>
          Outfit, Eureka, makeup, and cloak data is compiled by hand from public sources and may
          contain errors or omissions. Treat it as a helpful reference rather than an authoritative
          source, and please report anything that looks wrong.
        </SectionSubtitle>
      </Section>

      <Section>
        <SectionTitle>Suspension and termination</SectionTitle>
        <SectionSubtitle>
          You may delete your account at any time from Settings. We may suspend or remove an account
          that violates these terms, that abuses the service in a way that harms other users, or
          where required by law — we will use the least disruptive option available and, where
          practical, tell you why.
        </SectionSubtitle>
      </Section>

      <Section>
        <SectionTitle>Disclaimer and liability</SectionTitle>
        <SectionSubtitle>
          The service is provided &quot;as is&quot; and &quot;as available&quot;, without warranties
          of any kind, express or implied, including fitness for a particular purpose and
          non-infringement. To the fullest extent permitted by law, we are not liable for any
          indirect, incidental, or consequential damages, or for lost data or lost collection
          progress. Where liability cannot be excluded, it is limited to the greater of the amount
          you paid us in the past twelve months or ten US dollars. Some jurisdictions do not allow
          these exclusions, so parts of this section may not apply to you.
        </SectionSubtitle>
      </Section>

      <Section>
        <SectionTitle>Changes to these terms</SectionTitle>
        <SectionSubtitle>
          We may update these terms as the app evolves. The effective date at the top of this page
          reflects the latest version, and material changes will be announced in the app. Continuing
          to use the tracker after a change means you accept the updated terms.
        </SectionSubtitle>
      </Section>
    </LegalPage>
  )
}
