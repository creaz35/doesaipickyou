"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getDb, isFirebaseConfigured } from "@/lib/firebase/client";
import { isValidEmail, subscribe } from "@/lib/firebase/subscribers";

type State = "idle" | "sending" | "added" | "already" | "error";

export function Newsletter({
  title = "Get the monthly movers",
  text = "One email a month: who climbed, who dropped, and which tools went invisible. No spam, one click to leave.",
}: {
  title?: string;
  text?: string;
}) {
  const { user, profile } = useAuth();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");

  if (!isFirebaseConfigured) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setState("error");
      return;
    }
    setState("sending");
    try {
      const result = await subscribe(getDb(), email, {
        source: "newsletter",
        uid: user?.uid ?? null,
        firstName: profile?.firstName ?? null,
      });
      setState(result === "added" ? "added" : "already");
    } catch {
      setState("error");
    }
  }

  return (
    <section className="rounded-2xl border-2 border-stone-900 bg-emerald-50 p-6 text-center shadow-[5px_5px_0_0_var(--ink)] sm:p-8 dark:border-stone-600 dark:bg-emerald-950/40">
      <h2 className="font-display text-2xl font-bold sm:text-3xl">
        {title} <span aria-hidden="true">📬</span>
      </h2>
      <p className="mx-auto mt-2 max-w-md text-stone-600 dark:text-stone-400">{text}</p>

      {state === "added" || state === "already" ? (
        <p className="mt-5 font-medium text-emerald-700 dark:text-emerald-300">
          {state === "added"
            ? "🎉 You're in. See you at the next snapshot."
            : "✅ You're already on the list."}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mx-auto mt-5 flex max-w-md flex-col gap-2 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (state === "error") setState("idle");
            }}
            placeholder="you@example.com"
            aria-label="Email address"
            className="flex-1 rounded-xl border-2 border-stone-900 bg-white px-3 py-2.5 outline-none transition-all placeholder:text-stone-400 focus:-translate-y-0.5 focus:shadow-[3px_3px_0_0_var(--ink)] dark:border-stone-600 dark:bg-stone-900"
          />
          <button
            type="submit"
            disabled={state === "sending"}
            className="rounded-xl border-2 border-stone-900 bg-emerald-500 px-5 py-2.5 font-semibold text-white shadow-[3px_3px_0_0_var(--ink)] transition-transform hover:-translate-y-0.5 disabled:opacity-60 dark:border-stone-600"
          >
            {state === "sending" ? "Adding…" : "Subscribe"}
          </button>
        </form>
      )}

      {state === "error" && (
        <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">
          That didn&apos;t work. Check the address and try again.
        </p>
      )}
    </section>
  );
}
