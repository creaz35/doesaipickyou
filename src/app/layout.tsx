import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { AuthMenu } from "@/components/AuthMenu";
import { BrandMark } from "@/components/BrandMark";
import { MobileNav } from "@/components/MobileNav";
import { PageViewTracker } from "@/components/PageViewTracker";
import { SponsorRail } from "@/components/SponsorRail";
import { SponsorTicker } from "@/components/SponsorTicker";
import { AuthProvider } from "@/lib/auth-context";
import { getSponsors } from "@/lib/sponsor-data";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const GITHUB_URL = "https://github.com/creaz35/doesaipickyou";

// GA4 loads only when the measurement id is configured; inlined at build
// time, so setting it requires a rebuild, not a code change.
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  title: {
    default: "Does AI Pick You?",
    template: "%s · Does AI Pick You?",
  },
  description:
    "We ask ChatGPT, Claude, Gemini and Perplexity the questions your buyers ask, and track which products they actually recommend. Refreshed monthly.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Rendered with each page's ISR pass, so a newly activated sponsor shows
  // up within the hour without any client-side Firestore reads.
  const sponsors = await getSponsors();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
            </Script>
          </>
        )}
        <PageViewTracker />
        <AuthProvider>
          <SponsorTicker sponsors={sponsors} />
          <header className="relative border-b-2 border-stone-900 dark:border-stone-700">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
              <Link
                href="/"
                className="group flex items-center gap-2.5 font-display text-lg font-bold tracking-tight"
              >
                <BrandMark className="h-9 w-9 drop-shadow-sm transition-transform duration-200 group-hover:-rotate-6" />
                <span className="whitespace-nowrap leading-none">
                  does
                  <span className="mx-0.5 inline-block -rotate-3 rounded-md border-2 border-stone-900 bg-emerald-500 px-1 py-px align-middle font-mono text-[0.62em] font-bold leading-none text-white transition-transform duration-200 group-hover:rotate-3 dark:border-stone-500">
                    AI
                  </span>
                  pick
                  <span className="relative mx-px inline-block">
                    <span className="relative z-10">you</span>
                    <span
                      aria-hidden="true"
                      className="absolute -inset-x-0.5 bottom-0 h-[0.45em] -rotate-2 rounded-sm bg-emerald-300/90 dark:bg-emerald-500/40"
                    />
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400">?</span>
                </span>
              </Link>
              <nav className="flex items-center gap-5 text-sm font-medium text-stone-600 dark:text-stone-400">
                <Link
                  href="/"
                  className="hidden decoration-emerald-500 decoration-wavy underline-offset-4 hover:text-stone-900 hover:underline lg:inline dark:hover:text-stone-100"
                >
                  Leaderboards
                </Link>
                <Link
                  href="/categories"
                  className="hidden decoration-emerald-500 decoration-wavy underline-offset-4 hover:text-stone-900 hover:underline lg:inline dark:hover:text-stone-100"
                >
                  Categories
                </Link>
                <Link
                  href="/models"
                  className="hidden whitespace-nowrap decoration-emerald-500 decoration-wavy underline-offset-4 hover:text-stone-900 hover:underline lg:inline dark:hover:text-stone-100"
                >
                  By model
                </Link>
                <Link
                  href="/stats"
                  className="hidden decoration-emerald-500 decoration-wavy underline-offset-4 hover:text-stone-900 hover:underline lg:inline dark:hover:text-stone-100"
                >
                  Stats
                </Link>
                <Link
                  href="/methodology"
                  className="hidden decoration-emerald-500 decoration-wavy underline-offset-4 hover:text-stone-900 hover:underline lg:inline dark:hover:text-stone-100"
                >
                  Methodology
                </Link>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden decoration-emerald-500 decoration-wavy underline-offset-4 hover:text-stone-900 hover:underline lg:inline dark:hover:text-stone-100"
                >
                  GitHub
                </a>
                <AuthMenu />
                <MobileNav githubUrl={GITHUB_URL} />
              </nav>
            </div>
          </header>
          <SponsorRail side="left" sponsors={sponsors} />
          <SponsorRail side="right" sponsors={sponsors} />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">{children}</main>
          <footer className="border-t border-stone-300 py-6 text-sm text-stone-500 dark:border-stone-800">
            <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2 px-4">
              <span>Open source · MIT · refreshed monthly · built by</span>
              <a
                href="https://x.com/brian_millot"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 font-medium text-stone-700 dark:text-stone-300"
              >
                <Image
                  src="/img/brian-millot.webp"
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6 rounded-full border border-stone-300 object-cover transition-transform group-hover:-rotate-6 dark:border-stone-700"
                />
                <span className="decoration-emerald-500 decoration-wavy underline-offset-4 group-hover:underline">
                  Brian Millot
                </span>
              </a>
              <span aria-hidden="true">·</span>
              <a
                href={`${GITHUB_URL}/blob/main/CONTRIBUTING.md`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-stone-900 hover:underline dark:hover:text-stone-100"
              >
                submit your tool
              </a>
              <span aria-hidden="true">·</span>
              <Link
                href="/terms"
                className="hover:text-stone-900 hover:underline dark:hover:text-stone-100"
              >
                terms
              </Link>
              <span aria-hidden="true">·</span>
              <Link
                href="/privacy"
                className="hover:text-stone-900 hover:underline dark:hover:text-stone-100"
              >
                privacy
              </Link>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
