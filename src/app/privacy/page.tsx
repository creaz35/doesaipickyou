import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What doesaipickyou.com collects, what it never collects, and who else is involved.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <div className="space-y-2 text-stone-600 dark:text-stone-400">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Privacy</h1>
        <p className="mt-2 text-stone-500">
          Short version: minimal data, no ad tracking, nothing sold to anyone. Last updated 12
          August 2026.
        </p>
      </div>

      <Section title="What we collect">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-stone-800 dark:text-stone-200">Account data.</strong> If
            you sign up: your email, first and last name, and, with Google sign-in, your Google
            profile name. Stored in Firebase.
          </li>
          <li>
            <strong className="text-stone-800 dark:text-stone-200">Newsletter emails.</strong>{" "}
            The address you type into the signup box, plus whether it came from the form or
            from creating an account. Used only to send the newsletter.
          </li>
          <li>
            <strong className="text-stone-800 dark:text-stone-200">Sponsor details.</strong>{" "}
            The product name, tagline, website and contact email a sponsor submits. Payment
            happens on Stripe; card numbers never touch our servers, and the contact email is
            never published.
          </li>
          <li>
            <strong className="text-stone-800 dark:text-stone-200">Anonymous counters.</strong>{" "}
            Page views and outbound clicks, added up per day. There is no per-person record: we
            do not store IP addresses, fingerprints, or browsing histories, and the totals are
            public on the stats page.
          </li>
        </ul>
      </Section>

      <Section title="Cookies and localStorage">
        <p>
          No advertising cookies, no cross-site tracking. The site keeps a small flag in your
          browser&apos;s localStorage so you count as one visitor instead of five, and Firebase
          keeps a session token so you stay signed in. That is the whole list.
        </p>
      </Section>

      <Section title="Third parties involved">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-stone-800 dark:text-stone-200">Google Firebase</strong>{" "}
            stores accounts and the site&apos;s data.
          </li>
          <li>
            <strong className="text-stone-800 dark:text-stone-200">Stripe</strong> processes
            sponsor payments under its own privacy policy.
          </li>
          <li>
            <strong className="text-stone-800 dark:text-stone-200">Google&apos;s favicon
            service</strong> serves the tool logos, so your browser requests those images from
            Google, which sees the standard request data any image host sees.
          </li>
        </ul>
      </Section>

      <Section title="What is public">
        <p>
          The leaderboards, the raw model answers, the traffic stats, and sponsor cards are
          public by design. Your account details and newsletter address are not, and never
          will be.
        </p>
      </Section>

      <Section title="Deleting your data">
        <p>
          Want your account or newsletter entry gone? Message{" "}
          <a
            href="https://x.com/brian_millot"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-stone-900 dark:hover:text-stone-100"
          >
            @brian_millot on X
          </a>{" "}
          and it will be deleted. Every newsletter also includes an unsubscribe link.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          If this policy changes, the date above changes with it. Since the project is open
          source, the full history of this page lives in the repository.
        </p>
      </Section>
    </div>
  );
}
