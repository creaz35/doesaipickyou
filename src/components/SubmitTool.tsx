"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import {
  fetchCategoryDocs,
  RESERVED_SLUGS,
  TOOLS_COLLECTION,
  type CategoryDoc,
} from "@/lib/firebase/catalog";
import { getDb, isFirebaseConfigured } from "@/lib/firebase/client";
import {
  createSubmission,
  fetchMySubmissions,
  type SubmissionStatus,
  type ToolSubmission,
} from "@/lib/firebase/submissions";

const CONTRIBUTING_URL = "https://github.com/creaz35/doesaipickyou/blob/main/CONTRIBUTING.md";

const EMPTY_FORM = {
  name: "",
  id: "",
  url: "",
  price: "",
  aliases: "",
  categorySlugs: [] as string[],
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const INPUT_CLASS =
  "w-full rounded-xl border-2 border-stone-900 bg-white px-3 py-2.5 text-sm outline-none transition-all placeholder:text-stone-400 focus:-translate-y-0.5 focus:shadow-[3px_3px_0_0_var(--ink)] dark:border-stone-600 dark:bg-stone-950";

const STATUS_CHIP: Record<SubmissionStatus, { label: string; className: string }> = {
  pending: {
    label: "⏳ pending review",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  active: {
    label: "✅ live on the boards",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  rejected: {
    label: "❌ not accepted",
    className: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  },
};

export function SubmitTool() {
  const { user, profile, configured, loading } = useAuth();
  const [categories, setCategories] = useState<CategoryDoc[] | null>(null);
  const [mine, setMine] = useState<ToolSubmission[] | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [idEdited, setIdEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    fetchCategoryDocs(getDb())
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !user) return;
    fetchMySubmissions(getDb(), user.uid)
      .then(setMine)
      .catch(() => setMine([]));
  }, [user, submitted]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const name = form.name.trim();
    const id = form.id.trim();
    const price = form.price.trim();
    const rawUrl = form.url.trim();
    const aliases = form.aliases
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean)
      .map((a) =>
        a.endsWith("!")
          ? { text: a.slice(0, -1).trim(), caseSensitive: true }
          : { text: a, caseSensitive: false },
      )
      .filter((a) => a.text.length > 0);

    let url = "";
    try {
      const parsed = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
      if (parsed.hostname.includes(".")) url = parsed.toString();
    } catch {
      // caught below
    }

    if (!name) return setError("Name is required.");
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
      return setError("Id must be lowercase letters, digits and dashes.");
    }
    if (RESERVED_SLUGS.has(id)) {
      return setError(`"${id}" is a reserved name on this site, pick a different id.`);
    }
    if (!url) return setError("Enter a valid website URL.");
    if (!price) return setError('Price is required, short form (e.g. "Free + $9/mo").');
    if (aliases.length === 0) return setError("At least one alias is required (the name counts).");
    if (form.categorySlugs.length === 0) return setError("Pick at least one category.");

    setSubmitting(true);
    setError(null);
    try {
      // Taken by an existing tool? (The catalog is publicly readable.)
      const existing = await getDoc(doc(getDb(), TOOLS_COLLECTION, id));
      if (existing.exists()) {
        setError(
          `"${id}" is already on the leaderboards. If it's your product, claiming existing tools is coming soon; until then, open a GitHub issue and we'll link it to you.`,
        );
        return;
      }
      await createSubmission(getDb(), {
        id,
        name,
        url,
        price,
        aliases,
        categorySlugs: form.categorySlugs,
        uid: user.uid,
        email: profile?.email ?? user.email ?? null,
      });
      // Heads-up email to the reviewer; a failure here is invisible on
      // purpose, the submission itself already succeeded.
      void user
        .getIdToken()
        .then((token) =>
          fetch("/api/submission/notify", {
            method: "POST",
            headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
            body: JSON.stringify({ id }),
          }),
        )
        .catch(() => {});
      setForm({ ...EMPTY_FORM });
      setIdEdited(false);
      setSubmitted(true);
    } catch {
      // Create-only rules make a duplicate submission fail as an update.
      setError(`"${id}" was already submitted by someone. Pick a different id.`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="relative grid gap-6 lg:grid-cols-2">
        {/* Floats between the two paths on wide screens. */}
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 z-10 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 -rotate-6 items-center justify-center rounded-full border-2 border-stone-900 bg-amber-300 font-display text-sm font-bold text-stone-900 shadow-[3px_3px_0_0_var(--ink)] lg:flex"
        >
          or
        </span>

        {/* GitHub path */}
        <section className="group flex flex-col rounded-2xl border-2 border-stone-900 bg-white p-6 shadow-[5px_5px_0_0_var(--ink)] transition-all hover:-translate-y-1 hover:shadow-[7px_7px_0_0_var(--ink)] dark:border-stone-600 dark:bg-stone-900">
          <div className="flex items-start justify-between">
            <span
              className="inline-block text-4xl transition-transform duration-200 group-hover:-rotate-12 group-hover:scale-110"
              aria-hidden="true"
            >
              🐙
            </span>
            <span className="rounded-full border-2 border-stone-900 bg-stone-100 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest dark:border-stone-600 dark:bg-stone-800">
              the dev route
            </span>
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold">Pull request</h2>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            The indie way: the catalog is one file in an open-source repo, and your tool is one
            block in it. No account needed here.
          </p>

          <div className="mt-4 overflow-x-auto rounded-xl border-2 border-stone-900 bg-stone-950 p-4 dark:border-stone-700">
            <div className="mb-3 flex gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </div>
            <pre className="font-mono text-xs leading-relaxed text-stone-300">
              <span className="text-stone-500">{"// src/data/categories.ts"}</span>
              {"\n{\n"}
              {"  id: "}
              <span className="text-emerald-400">&quot;yourtool&quot;</span>
              {",\n  name: "}
              <span className="text-emerald-400">&quot;YourTool&quot;</span>
              {",\n  url: "}
              <span className="text-emerald-400">&quot;https://yourtool.com&quot;</span>
              {",\n  price: "}
              <span className="text-emerald-400">&quot;Free + $9/mo&quot;</span>
              {",\n  aliases: ["}
              <span className="text-emerald-400">&quot;YourTool&quot;</span>
              {", "}
              <span className="text-emerald-400">&quot;Your Tool&quot;</span>
              {"],\n},"}
            </pre>
          </div>

          <ol className="mt-4 flex-1 space-y-2 text-sm text-stone-600 dark:text-stone-400">
            <li className="flex gap-2">
              <span className="font-mono font-bold text-stone-900 dark:text-stone-200">1.</span>
              Add your block to the category you compete in
            </li>
            <li className="flex gap-2">
              <span className="font-mono font-bold text-stone-900 dark:text-stone-200">2.</span>
              Open a PR; review happens in the open
            </li>
            <li className="flex gap-2">
              <span className="font-mono font-bold text-stone-900 dark:text-stone-200">3.</span>
              Merged = approved, ranked at the next run
            </li>
          </ol>

          <a
            href={CONTRIBUTING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-block self-start rounded-xl border-2 border-stone-900 bg-stone-900 px-4 py-2 font-semibold text-white shadow-[3px_3px_0_0_var(--ink)] transition-transform hover:-translate-y-0.5 dark:border-stone-500"
          >
            Open CONTRIBUTING.md ↗
          </a>
        </section>

        {/* In-site path */}
        <section className="group flex flex-col rounded-2xl border-2 border-stone-900 bg-emerald-50 p-6 shadow-[5px_5px_0_0_var(--ink)] transition-all hover:-translate-y-1 hover:shadow-[7px_7px_0_0_var(--ink)] dark:border-stone-600 dark:bg-emerald-950/40">
          <div className="flex items-start justify-between">
            <span
              className="inline-block text-4xl transition-transform duration-200 group-hover:rotate-12 group-hover:scale-110"
              aria-hidden="true"
            >
              📝
            </span>
            <span className="rounded-full border-2 border-stone-900 bg-white px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest dark:border-stone-600 dark:bg-stone-900">
              the 2-minute route
            </span>
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold">Submit right here</h2>

          {!configured || loading ? (
            <p className="mt-2 text-stone-500">Loading…</p>
          ) : !user ? (
            <>
              <p className="mt-2 flex-1 text-stone-600 dark:text-stone-400">
                Fill in a form, a human reviews it, and your tool joins the next snapshot run.
                Submitting links the tool to your account, so future maker features (claiming,
                alerts) know it&apos;s yours. Needs a free account, that&apos;s the review trail.
              </p>
              <Link
                href="/signin"
                className="mt-5 inline-block self-start rounded-xl border-2 border-stone-900 bg-emerald-500 px-4 py-2 font-semibold text-white shadow-[3px_3px_0_0_var(--ink)] transition-transform hover:-translate-y-0.5 dark:border-stone-600"
              >
                Sign in to submit
              </Link>
            </>
          ) : (
            <form onSubmit={onSubmit} className="mt-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                      ...(idEdited ? {} : { id: slugify(e.target.value) }),
                    }))
                  }
                  placeholder="Tool name"
                  aria-label="Tool name"
                  className={INPUT_CLASS}
                />
                <input
                  type="text"
                  value={form.id}
                  onChange={(e) => {
                    setIdEdited(true);
                    setForm((prev) => ({ ...prev, id: e.target.value }));
                  }}
                  placeholder="id-slug (your URL on the site)"
                  aria-label="Tool id"
                  className={`${INPUT_CLASS} font-mono`}
                />
                <input
                  type="text"
                  value={form.url}
                  onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder="yourtool.com"
                  aria-label="Website"
                  className={INPUT_CLASS}
                />
                <input
                  type="text"
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                  placeholder='Price (e.g. "Free + $9/mo")'
                  aria-label="Price"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <input
                  type="text"
                  value={form.aliases}
                  onChange={(e) => setForm((prev) => ({ ...prev, aliases: e.target.value }))}
                  placeholder="Aliases, comma separated (include the name)"
                  aria-label="Aliases"
                  className={INPUT_CLASS}
                />
                <p className="mt-1 text-xs text-stone-500">
                  Every name AI models use for your product; only these count as mentions. End
                  one with ! for case-sensitive matching (names that are common words).
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(categories ?? []).map((c) => {
                  const active = form.categorySlugs.includes(c.slug);
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          categorySlugs: active
                            ? prev.categorySlugs.filter((s) => s !== c.slug)
                            : [...prev.categorySlugs, c.slug],
                        }))
                      }
                      className={`rounded-full border-2 px-3 py-1 text-xs transition-all ${
                        active
                          ? "border-stone-900 bg-white font-semibold dark:border-emerald-500 dark:bg-stone-900"
                          : "border-stone-300 bg-white/60 text-stone-600 hover:border-stone-900 dark:border-stone-700 dark:bg-stone-900/60 dark:text-stone-400"
                      }`}
                    >
                      {active ? "✓ " : ""}
                      {c.emoji} {c.name}
                    </button>
                  );
                })}
              </div>
              {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl border-2 border-stone-900 bg-emerald-500 px-5 py-2.5 font-semibold text-white shadow-[3px_3px_0_0_var(--ink)] transition-transform hover:-translate-y-0.5 disabled:opacity-60 dark:border-stone-600"
              >
                {submitting ? "Submitting…" : "Submit for review 🚀"}
              </button>
              {submitted && (
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  🎉 Submitted! A human reviews it, then it joins the next snapshot run.
                </p>
              )}
            </form>
          )}
        </section>
      </div>

      {user && mine && mine.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl font-bold">Your submissions</h2>
          <ul className="space-y-2">
            {mine.map((submission) => (
              <li
                key={submission.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-stone-200 px-4 py-3 dark:border-stone-800"
              >
                <span className="font-medium">{submission.name}</span>
                <span className="font-mono text-xs text-stone-400">/{submission.id}</span>
                <span className="flex-1" />
                <span
                  className={`rounded-full px-2.5 py-0.5 font-mono text-xs ${STATUS_CHIP[submission.status].className}`}
                >
                  {STATUS_CHIP[submission.status].label}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
