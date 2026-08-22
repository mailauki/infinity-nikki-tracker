import { Metadata } from 'next'
import { Link as Anchor } from '@mui/material'
import { Section, SectionList, SectionSubtitle, SectionTitle } from '@/components/section'
import { pageTitle } from '@/lib/page-titles'
import LegalPage from '../legal-page'
import { LEGAL_CONTACT_EMAIL } from '../legal-meta'

export const metadata: Metadata = {
  title: pageTitle('/privacy-policy'),
  description:
    'What the Infinity Nikki Tracker stores, why, and how to get your data exported or deleted.',
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      summary="We store the account you create and the collection progress you track. We don't sell your data, we don't run ad networks, and you can delete your account and everything in it at any time from Settings."
      title={pageTitle('/privacy-policy')}
    >
      <Section>
        <SectionTitle>Who we are</SectionTitle>
        <SectionSubtitle>
          Infinity Nikki Tracker is a fan-made, open-source collection tracker run by an individual
          developer, not a company. This policy explains what the app stores about you, why it
          stores it, and how to get it back or get rid of it.
        </SectionSubtitle>
      </Section>

      <Section>
        <SectionTitle>What we collect</SectionTitle>
        <SectionSubtitle>
          You can browse the entire tracker without an account. Nothing in this section applies
          until you choose to sign up.
        </SectionSubtitle>

        <SectionTitle component="h3" size="small">
          Account information
        </SectionTitle>
        <SectionList
          bullets={[
            'Your email address, used to sign you in and to send password resets — never marketing',
            'A password, which is hashed by our authentication provider and never visible to us',
            'Optional profile details you choose to add: display name, username, and avatar image',
          ]}
        />

        <SectionTitle component="h3" size="small">
          Collection data
        </SectionTitle>
        <SectionList
          bullets={[
            'Which outfits, Eureka pieces, makeup variants, and cloaks you have marked as obtained',
            'Custom Looks you build and save, including the pieces they contain',
            'Your preferences — color theme, text size, sort order, filters, and view settings',
          ]}
        />

        <SectionTitle component="h3" size="small">
          Payments
        </SectionTitle>
        <SectionSubtitle>
          Optional support payments and premium upgrades are processed by Stripe. Card details go
          directly to Stripe and never touch our servers — we store only whether your account is
          premium and when it was purchased.
        </SectionSubtitle>

        <SectionTitle component="h3" size="small">
          Analytics
        </SectionTitle>
        <SectionSubtitle>
          We use Vercel Analytics and Speed Insights to see which pages are used and how fast they
          load. These are privacy-friendly and cookie-free: they do not build a profile of you, do
          not track you across other sites, and do not use your data for advertising.
        </SectionSubtitle>

        <SectionTitle component="h3" size="small">
          Feedback you send
        </SectionTitle>
        <SectionSubtitle>
          If you report an issue or request a feature, we store the message, any screenshots you
          attach, and the page you were on so the report can be acted on.
        </SectionSubtitle>
      </Section>

      <Section>
        <SectionTitle>What we don&apos;t do</SectionTitle>
        <SectionList
          bullets={[
            'We do not sell, rent, or trade your personal information to anyone',
            'We do not run advertising networks or third-party ad trackers',
            'We do not use your collection data to train machine learning models',
            'We do not email you marketing — account emails are transactional only',
          ]}
        />
      </Section>

      <Section>
        <SectionTitle>Cookies and local storage</SectionTitle>
        <SectionSubtitle>
          We use only what the app needs to function — there is no advertising or cross-site
          tracking, so there is no cookie consent banner to dismiss.
        </SectionSubtitle>
        <SectionList
          bullets={[
            'Session cookies that keep you signed in between visits',
            'Small preference cookies that remember whether the navigation drawer and sidebar were open, so the page does not visibly shift on load',
            'Local storage that remembers your text size and color scheme, so the app paints at the right size before it finishes loading',
          ]}
        />
      </Section>

      <Section>
        <SectionTitle>Who processes your data</SectionTitle>
        <SectionSubtitle>
          The app is built on a small number of third-party services. Each one only receives what it
          needs to do its job.
        </SectionSubtitle>
        <SectionList
          bullets={[
            <>
              <Anchor
                key="supabase"
                color="textSecondary"
                href="https://supabase.com/privacy"
                rel="noreferrer"
                target="_blank"
              >
                Supabase
              </Anchor>{' '}
              — database, authentication, and image storage
            </>,
            <>
              <Anchor
                key="vercel"
                color="textSecondary"
                href="https://vercel.com/legal/privacy-policy"
                rel="noreferrer"
                target="_blank"
              >
                Vercel
              </Anchor>{' '}
              — hosting, plus the analytics described above
            </>,
            <>
              <Anchor
                key="stripe"
                color="textSecondary"
                href="https://stripe.com/privacy"
                rel="noreferrer"
                target="_blank"
              >
                Stripe
              </Anchor>{' '}
              — payment processing for support payments and premium
            </>,
          ]}
        />
      </Section>

      <Section>
        <SectionTitle>Your public profile</SectionTitle>
        <SectionSubtitle>
          If you set a username, your collection progress becomes viewable at{' '}
          <code>/u/your-username</code>. That page shows your display name, avatar, and completion
          stats — never your email address. Removing your username removes the public page.
        </SectionSubtitle>
      </Section>

      <Section>
        <SectionTitle>Your rights and choices</SectionTitle>
        <SectionList
          bullets={[
            'Access and correct — view and edit your profile details from Settings at any time',
            'Delete — deleting your account from Settings removes your profile, collection data, saved looks, and preferences',
            'Export — email us and we will send you a copy of the data tied to your account',
            'Withdraw — you can stop using the app and delete your account without penalty; browsing stays available without one',
          ]}
        />
        <SectionSubtitle>
          Depending on where you live, you may have additional rights under laws such as the GDPR or
          CCPA. We honor these requests regardless of where you live — email{' '}
          <Anchor color="textSecondary" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
            {LEGAL_CONTACT_EMAIL}
          </Anchor>{' '}
          and we will respond within 30 days.
        </SectionSubtitle>
      </Section>

      <Section>
        <SectionTitle>Data retention and security</SectionTitle>
        <SectionSubtitle>
          We keep your data for as long as your account exists. When you delete your account it is
          removed from the live database; encrypted backups may retain it briefly before they age
          out. Data is protected in transit by HTTPS and at rest by our database provider, and
          row-level security rules restrict every record to its owner. No system is perfectly
          secure, so we cannot guarantee absolute security.
        </SectionSubtitle>
      </Section>

      <Section>
        <SectionTitle>Children</SectionTitle>
        <SectionSubtitle>
          This app is not directed at children under 13, and we do not knowingly collect their
          information. If you believe a child has created an account, email us and we will remove
          it.
        </SectionSubtitle>
      </Section>

      <Section>
        <SectionTitle>Changes to this policy</SectionTitle>
        <SectionSubtitle>
          If this policy changes we will update the effective date at the top of this page. For
          material changes we will make a clear notice in the app. Continuing to use the tracker
          after a change means you accept the updated policy.
        </SectionSubtitle>
      </Section>
    </LegalPage>
  )
}
