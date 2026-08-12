"use client";

import Link from "next/link";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "🏆 Leaderboards" },
  { href: "/categories", label: "🗂️ Categories" },
  { href: "/models", label: "🤖 By model" },
  { href: "/stats", label: "📈 Stats" },
  { href: "/methodology", label: "🔬 Methodology" },
  { href: "/sponsor", label: "🪧 Sponsor" },
];

/**
 * Hamburger menu for small screens, where the full link row doesn't fit.
 * The dropdown panel is positioned against the <header>, which must stay
 * `relative` for inset-x-0/top-full to span the full width.
 */
export function MobileNav({ githubUrl }: { githubUrl: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-stone-900 bg-white text-base text-stone-900 shadow-[2px_2px_0_0_var(--ink)] transition-transform active:translate-y-0.5 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
      >
        <span aria-hidden="true">{open ? "✕" : "☰"}</span>
      </button>

      {open && (
        <nav className="absolute inset-x-0 top-full z-50 border-b-2 border-stone-900 bg-white px-4 py-3 text-stone-900 shadow-[0_6px_0_0_var(--ink)] dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100">
          <ul className="space-y-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-2 py-2 font-medium hover:bg-stone-100 dark:hover:bg-stone-900"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-2 py-2 font-medium hover:bg-stone-100 dark:hover:bg-stone-900"
              >
                ⭐ GitHub ↗
              </a>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
