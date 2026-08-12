"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { spotLabel } from "@/lib/sponsor-spots";

interface Confirmation {
  paid: boolean;
  name: string | null;
  spot: string | null;
  amountUsd: number;
}

type State =
  | { status: "checking" }
  | { status: "paid"; confirmation: Confirmation }
  | { status: "unpaid" }
  | { status: "error" };

/** Reads ?session_id= from Stripe's redirect and verifies it server-side. */
export function SponsorThanks() {
  const [state, setState] = useState<State>({ status: "checking" });

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot init from the URL
      setState({ status: "error" });
      return;
    }
    void (async () => {
      try {
        const response = await fetch(
          `/api/sponsor/confirm?session_id=${encodeURIComponent(sessionId)}`,
        );
        if (!response.ok) throw new Error();
        const confirmation = (await response.json()) as Confirmation;
        setState(confirmation.paid ? { status: "paid", confirmation } : { status: "unpaid" });
      } catch {
        setState({ status: "error" });
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-lg space-y-6 py-10 text-center">
      {state.status === "checking" && (
        <p className="text-stone-500">Checking your payment with Stripe…</p>
      )}

      {state.status === "paid" && (
        <>
          <div className="text-6xl" aria-hidden="true">
            🎉
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">You&apos;re in!</h1>
          <p className="text-stone-600 dark:text-stone-400">
            Payment received{state.confirmation.name ? ` for ${state.confirmation.name}` : ""}
            {state.confirmation.spot
              ? `, ${spotLabel(state.confirmation.spot).toLowerCase()}`
              : ""}
            . Your card goes live after a quick human review, usually the same day. The receipt
            is in your inbox.
          </p>
        </>
      )}

      {state.status === "unpaid" && (
        <>
          <div className="text-6xl" aria-hidden="true">
            🤔
          </div>
          <h1 className="font-display text-3xl font-bold">Payment not completed</h1>
          <p className="text-stone-600 dark:text-stone-400">
            Stripe reports this checkout as unpaid. If that seems wrong, reply to the Stripe
            email or try again.
          </p>
          <Link
            href="/sponsor"
            className="inline-block rounded-xl border-2 border-stone-900 bg-white px-4 py-2 font-semibold shadow-[3px_3px_0_0_var(--ink)] transition-transform hover:-translate-y-0.5 dark:border-stone-600 dark:bg-stone-900"
          >
            Back to spot picking
          </Link>
        </>
      )}

      {state.status === "error" && (
        <>
          <div className="text-6xl" aria-hidden="true">
            👻
          </div>
          <h1 className="font-display text-3xl font-bold">Nothing to confirm</h1>
          <p className="text-stone-600 dark:text-stone-400">
            This page only works right after a Stripe checkout.
          </p>
          <Link
            href="/sponsor"
            className="inline-block rounded-xl border-2 border-stone-900 bg-white px-4 py-2 font-semibold shadow-[3px_3px_0_0_var(--ink)] transition-transform hover:-translate-y-0.5 dark:border-stone-600 dark:bg-stone-900"
          >
            Sponsor a spot
          </Link>
        </>
      )}
    </div>
  );
}
