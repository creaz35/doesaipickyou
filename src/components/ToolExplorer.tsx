"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { InvisibleBadge } from "@/components/InvisibleBadge";
import { ToolIcon } from "@/components/ToolIcon";
import type { ProductScore } from "@/lib/types";

export interface CategoryTab {
  slug: string;
  emoji: string;
  name: string;
  scores: ProductScore[];
}

interface RankedTool {
  score: ProductScore;
  category: { slug: string; name: string; emoji: string };
}

const MEDALS = ["🥇", "🥈", "🥉"];

function Rank({ rank }: { rank: number }) {
  if (rank <= 3) {
    return <span className="w-7 shrink-0 text-center text-lg">{MEDALS[rank - 1]}</span>;
  }
  return <span className="w-7 shrink-0 text-center font-mono text-sm text-stone-400">{rank}</span>;
}

function ToolRow({ tool, rank }: { tool: RankedTool; rank: number }) {
  const { score, category } = tool;
  return (
    <li className="-mx-2 flex items-center gap-3 rounded-xl border-b border-stone-200/70 px-2 py-3 transition-colors hover:bg-stone-50 dark:border-stone-800/70 dark:hover:bg-stone-900">
      <Rank rank={rank} />
      <ToolIcon name={score.name} url={score.url} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/${score.productId}`}
            className="truncate font-medium hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            {score.name}
          </Link>
          {score.visibility === 0 && <InvisibleBadge />}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-stone-500">
          <Link
            href={`/category/${category.slug}`}
            className="truncate hover:text-emerald-600 hover:underline dark:hover:text-emerald-400"
          >
            {category.emoji} {category.name}
          </Link>
          <span aria-hidden="true">·</span>
          <span className="shrink-0 font-mono">{score.price}</span>
        </div>
      </div>
      <span className="hidden w-10 shrink-0 text-right font-mono text-sm text-stone-500 sm:block">
        {Math.round(score.mentionRate * 100)}%
      </span>
      <div className="hidden h-2.5 w-28 shrink-0 overflow-hidden rounded-full bg-stone-200 sm:block dark:bg-stone-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
          style={{ width: `${score.visibility}%` }}
        />
      </div>
      {rank === 1 ? (
        <span className="w-12 shrink-0 rounded-lg bg-emerald-400/25 py-0.5 text-center font-mono text-sm font-bold text-emerald-700 dark:text-emerald-300">
          {score.visibility}
        </span>
      ) : (
        <span className="w-12 shrink-0 text-center font-mono text-sm font-semibold">
          {score.visibility}
        </span>
      )}
    </li>
  );
}

function ListHeader() {
  return (
    <div className="flex items-center gap-3 border-b-2 border-stone-900 pb-2 font-mono text-[10px] uppercase tracking-widest text-stone-500 dark:border-stone-700">
      <span className="w-7 shrink-0" />
      <span className="w-8 shrink-0" />
      <span className="flex-1">Tool</span>
      <span className="hidden w-10 shrink-0 text-right sm:block">Rate</span>
      <span className="hidden w-28 shrink-0 sm:block" />
      <span className="w-12 shrink-0 text-center">Score</span>
    </div>
  );
}

export function ToolExplorer({ categories }: { categories: CategoryTab[] }) {
  const [query, setQuery] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" focuses the search bar from anywhere on the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // One global board: every tool from every category, ranked by visibility.
  const allTools: RankedTool[] = useMemo(
    () =>
      categories
        .flatMap((c) =>
          c.scores.map((s) => ({
            score: s,
            category: { slug: c.slug, name: c.name, emoji: c.emoji },
          })),
        )
        .sort(
          (a, b) =>
            b.score.visibility - a.score.visibility || a.score.name.localeCompare(b.score.name),
        ),
    [categories],
  );

  // The placeholder types itself: the count line, then the big names on
  // the board, one at a time. Purely cosmetic.
  useEffect(() => {
    const phrases = [
      `Search ${allTools.length} tools across ${categories.length} categories`,
      ...allTools.slice(0, 8).map((t) => t.score.name),
    ];
    let cancelled = false;
    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    const step = () => {
      if (cancelled) return;
      const phrase = phrases[phraseIndex];
      if (!deleting) {
        charIndex += 1;
        setPlaceholder(phrase.slice(0, charIndex) + "▏");
        if (charIndex >= phrase.length) {
          deleting = true;
          setPlaceholder(phrase);
          timer = setTimeout(step, 1800);
          return;
        }
        timer = setTimeout(step, 55);
      } else {
        charIndex -= 1;
        setPlaceholder(phrase.slice(0, charIndex) + "▏");
        if (charIndex <= 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
        }
        timer = setTimeout(step, 20);
      }
    };
    timer = setTimeout(step, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [allTools, categories.length]);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return null;
    return allTools.filter(
      (t) => t.score.name.toLowerCase().includes(q) || t.category.name.toLowerCase().includes(q),
    );
  }, [q, allTools]);

  const board = results ?? allTools;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
      <div className="group relative mx-auto max-w-xl">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-stone-400 transition-all duration-200 group-focus-within:-rotate-12 group-focus-within:scale-110 group-focus-within:text-emerald-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || `Search ${allTools.length} tools`}
          aria-label={`Search ${allTools.length} tools across ${categories.length} categories`}
          className="w-full rounded-2xl border-2 border-stone-900 bg-white py-3.5 pl-12 pr-12 text-base caret-emerald-500 shadow-[4px_4px_0_0_var(--ink)] outline-none transition-all placeholder:text-stone-400 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--ink)] focus:-translate-x-0.5 focus:-translate-y-0.5 focus:border-emerald-600 focus:shadow-[6px_6px_0_0_var(--ink)] dark:border-stone-600 dark:bg-stone-900 dark:focus:border-emerald-500"
        />
        <kbd className="pointer-events-none absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-md border border-stone-300 bg-stone-100 px-2 py-0.5 font-mono text-xs text-stone-500 dark:border-stone-700 dark:bg-stone-800">
          /
        </kbd>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-2 -top-2 z-10 select-none text-lg opacity-0 transition-all duration-300 group-focus-within:-rotate-12 group-focus-within:opacity-100"
        >
          ✨
        </span>
      </div>

      {/* One swipeable row on phones, a centered wrapping cloud from sm up. */}
      <nav aria-label="Browse by category" className="-mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-0">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="shrink-0 whitespace-nowrap rounded-full border-2 border-stone-300 bg-white px-3 py-1 text-xs text-stone-700 transition-all hover:-translate-y-0.5 hover:border-stone-900 hover:shadow-[2px_2px_0_0_var(--ink)] sm:px-3.5 sm:py-1.5 sm:text-sm dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-400"
            >
              {c.emoji} {c.name}
            </Link>
          ))}
        </div>
      </nav>
      </div>

      <div>
        {results ? (
          <p className="mb-2 text-sm text-stone-500">
            {results.length} {results.length === 1 ? "result" : "results"} for &ldquo;{query.trim()}&rdquo;
          </p>
        ) : (
          <div className="mb-3">
            <h2 className="font-display text-2xl font-bold">The big board</h2>
            <p className="text-sm text-stone-500">
              All {allTools.length} tools, every category, one ranking.
            </p>
          </div>
        )}

        {board.length > 0 ? (
          <>
            <ListHeader />
            <ol>
              {board.map((tool, i) => (
                <ToolRow
                  key={`${tool.category.slug}-${tool.score.productId}`}
                  tool={tool}
                  rank={i + 1}
                />
              ))}
            </ol>
          </>
        ) : (
          <p className="py-8 text-center text-stone-500">
            {results
              ? "🤷 No tools match. Think one belongs here? Open an issue."
              : "First snapshot pending."}
          </p>
        )}
      </div>
    </div>
  );
}
