"use client";

import { useEffect, useMemo, useState } from "react";
import { ToolIcon } from "@/components/ToolIcon";
import {
  isSpotId,
  railSpots,
  RENEWAL_LABELS,
  SPONSOR_LIMITS,
  spotLabel,
  type RailSide,
  type SponsorInfo,
} from "@/lib/sponsor-spots";

/**
 * Spot picker + details form + Stripe redirect. `sponsors` and `priceUsd`
 * come server-rendered (may be a few minutes stale); the checkout API
 * re-verifies both, so the worst case is a "spot was just taken" error.
 */
export function SponsorCheckout({
  sponsors,
  priceUsd,
}: {
  sponsors: SponsorInfo[];
  priceUsd: number | null;
}) {
  const taken = useMemo(() => new Map(sponsors.map((s) => [s.spot, s])), [sponsors]);

  const [spot, setSpot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rail placeholders link here as /sponsor?spot=left-3; preselect it.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("spot");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot init from the URL, before any interaction
    if (wanted && isSpotId(wanted) && !taken.has(wanted)) setSpot(wanted);
  }, [taken]);

  const previewUrl = useMemo(() => {
    try {
      return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).toString();
    } catch {
      return null;
    }
  }, [url]);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const ready =
    Boolean(spot) && name.trim().length > 0 && tagline.trim().length > 0 && previewUrl && emailOk;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/sponsor/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          spot,
          name: name.trim(),
          tagline: tagline.trim(),
          url: previewUrl,
          email: email.trim(),
        }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error ?? "Checkout failed. Try again.");
      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed. Try again.");
      setSubmitting(false);
    }
  }

  if (!priceUsd) {
    return (
      <p className="mx-auto max-w-md rounded-2xl border-2 border-dashed border-stone-300 p-8 text-center text-stone-500 dark:border-stone-700">
        Sponsorship isn&apos;t open just yet. Check back soon 👀
      </p>
    );
  }

  const inputClass =
    "w-full rounded-xl border-2 border-stone-900 bg-white px-3 py-2.5 outline-none transition-all placeholder:text-stone-400 focus:-translate-y-0.5 focus:shadow-[3px_3px_0_0_var(--ink)] dark:border-stone-600 dark:bg-stone-900";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      {/* Step 1: pick a spot */}
      <section>
        <h2 className="mb-1 font-display text-xl font-bold">1. Pick your spot</h2>
        <p className="mb-4 text-sm text-stone-500">
          Top slots are seen first. Taken slots show who beat you to them.
        </p>
        <div className="grid grid-cols-2 gap-4">
          {(["left", "right"] as RailSide[]).map((side) => (
            <div key={side} className="space-y-2">
              <p className="text-center font-mono text-[10px] uppercase tracking-widest text-stone-500">
                {side} rail
              </p>
              {railSpots(side).map((id) => {
                const sponsor = taken.get(id);
                const selected = spot === id;
                if (sponsor) {
                  return (
                    <div
                      key={id}
                      className="rounded-xl border-2 border-stone-200 bg-stone-100 px-3 py-2 text-sm text-stone-400 dark:border-stone-800 dark:bg-stone-900"
                      title={`Taken by ${sponsor.name}`}
                    >
                      <div className="flex items-center gap-2">
                        <ToolIcon name={sponsor.name} url={sponsor.url} size={18} />
                        <span className="truncate">{sponsor.name}</span>
                      </div>
                      {sponsor.endsAt && (
                        <p className="mt-1 text-[11px] leading-tight text-stone-400">
                          until{" "}
                          {new Date(sponsor.endsAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}
                          {sponsor.renewal ? ` · ${RENEWAL_LABELS[sponsor.renewal]}` : ""}
                        </p>
                      )}
                    </div>
                  );
                }
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSpot(selected ? null : id)}
                    className={`flex w-full items-center justify-between rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all ${
                      selected
                        ? "-translate-y-0.5 border-stone-900 bg-emerald-100 shadow-[3px_3px_0_0_var(--ink)] dark:border-emerald-500 dark:bg-emerald-950"
                        : "border-dashed border-stone-300 hover:border-stone-900 dark:border-stone-700 dark:hover:border-stone-400"
                    }`}
                  >
                    <span>slot {id.split("-")[1]}</span>
                    <span aria-hidden="true">{selected ? "✓" : "+"}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      {/* Step 2: details + pay */}
      <section>
        <h2 className="mb-1 font-display text-xl font-bold">2. Your card</h2>
        <p className="mb-4 text-sm text-stone-500">
          This is exactly what visitors will see, favicon included.
        </p>

        {/* Live preview, same anatomy as the real rail card */}
        <div className="mb-5 flex justify-center rounded-2xl border-2 border-stone-200 bg-stone-50 py-6 dark:border-stone-800 dark:bg-stone-900/50">
          <div className="w-52 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 text-center dark:border-emerald-900 dark:bg-emerald-950">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-stone-900">
              {previewUrl ? (
                <ToolIcon name={name || "?"} url={previewUrl} size={28} />
              ) : (
                <span className="text-lg text-stone-400">?</span>
              )}
            </div>
            <div className="font-mono text-sm font-semibold">{name || "Your product"}</div>
            <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
              {tagline || "your one-line pitch"}
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              required
              maxLength={SPONSOR_LIMITS.name}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Product name"
              aria-label="Product name"
              className={inputClass}
            />
            <input
              type="text"
              required
              maxLength={SPONSOR_LIMITS.url}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="yourproduct.com"
              aria-label="Website URL"
              className={inputClass}
            />
          </div>
          <input
            type="text"
            required
            maxLength={SPONSOR_LIMITS.tagline}
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="One-line pitch (what does it do?)"
            aria-label="Tagline"
            className={inputClass}
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourproduct.com (for the receipt)"
            aria-label="Email address"
            className={inputClass}
          />

          <button
            type="submit"
            disabled={!ready || submitting}
            className="w-full rounded-xl border-2 border-stone-900 bg-emerald-500 px-5 py-3 font-semibold text-white shadow-[3px_3px_0_0_var(--ink)] transition-transform hover:-translate-y-0.5 disabled:opacity-50 dark:border-stone-600"
          >
            {submitting
              ? "Heading to Stripe…"
              : spot
                ? `Pay $${priceUsd} for ${spotLabel(spot).toLowerCase()} →`
                : "Pick a spot first"}
          </button>

          {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

          <p className="text-center text-xs text-stone-500">
            ${priceUsd} one-time · 30 days on every page · live after a quick human review,
            usually same day.
          </p>
        </form>
      </section>
    </div>
  );
}
