import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms of use for doesaipickyou.com, in plain words.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <div className="space-y-2 text-stone-600 dark:text-stone-400">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Terms of use</h1>
        <p className="mt-2 text-stone-500">
          Plain words, no legalese theater. Last updated 12 August 2026.
        </p>
      </div>

      <Section title="What this site is">
        <p>
          doesaipickyou.com measures how often AI models recommend software products. We ask
          ChatGPT, Claude and friends the questions buyers ask, parse the answers, and publish
          the results as monthly leaderboards. The code is open source under the MIT license.
        </p>
      </Section>

      <Section title="The rankings are measurements, not endorsements">
        <p>
          A score describes what AI models said during a specific snapshot, nothing more. It is
          not advice, an endorsement, or a statement about a product&apos;s quality. Models
          change their answers between snapshots, and our parser can miss an alias. If a number
          looks wrong, the methodology and raw answers are public: check them, then open an
          issue.
        </p>
        <p className="font-medium text-stone-700 dark:text-stone-300">
          Sponsorship never affects rankings. Sponsor cards are ads on the edges of the page;
          the leaderboards are computed from model answers alone.
        </p>
      </Section>

      <Section title="Accounts">
        <p>
          Accounts exist so admins can manage the site and, later, so makers can claim their
          tools. Give accurate information and keep your password to yourself. We may remove
          accounts that abuse the service.
        </p>
      </Section>

      <Section title="Sponsorship">
        <p>
          Sponsor spots are sold on the <Link href="/sponsor" className="underline hover:text-stone-900 dark:hover:text-stone-100">sponsor page</Link>{" "}
          as a one-time Stripe payment covering 30 days, starting when the card goes live after
          a quick human review. We may decline or take down a card that is illegal, misleading,
          adult, or otherwise damaging to the site; if that happens before or during the run,
          we refund the unused time. Clicks are counted honestly and tagged with UTM parameters
          so you can verify them in your own analytics.
        </p>
      </Section>

      <Section title="Acceptable use">
        <p>
          Do not attack the service: no flooding the public counters, no scraping at rates
          that degrade the site, no attempts to bypass the security rules. The data is public
          and the code is MIT, so if you want it, take it the polite way.
        </p>
      </Section>

      <Section title="Sharing the data">
        <p>
          Screenshots and excerpts of the leaderboards are welcome anywhere, with a link back
          to the page you took them from.
        </p>
      </Section>

      <Section title="No warranty">
        <p>
          The service is provided as is, without warranty of any kind. To the extent the law
          allows, we are not liable for decisions made based on the rankings or for the site
          being wrong, slow, or down.
        </p>
      </Section>

      <Section title="Changes and contact">
        <p>
          These terms can change as the project evolves; the date above tells you when they
          last did. Questions or problems: message{" "}
          <a
            href="https://x.com/brian_millot"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-stone-900 dark:hover:text-stone-100"
          >
            @brian_millot on X
          </a>
          .
        </p>
      </Section>
    </div>
  );
}
