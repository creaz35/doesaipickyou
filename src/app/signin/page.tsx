"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

const FIELD_CLASS =
  "w-full rounded-xl border-2 border-stone-900 bg-white px-3 py-2.5 outline-none transition-all placeholder:text-stone-400 focus:-translate-y-0.5 focus:shadow-[3px_3px_0_0_var(--ink)] dark:border-stone-600 dark:bg-stone-900";

/** Firebase error codes users can actually act on. */
function friendlyError(code: unknown): string {
  const map: Record<string, string> = {
    "auth/invalid-credential": "That email and password do not match.",
    "auth/user-not-found": "No account with that email. Create one below.",
    "auth/wrong-password": "That email and password do not match.",
    "auth/email-already-in-use": "That email already has an account. Sign in instead.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/invalid-email": "That email address does not look right.",
    "auth/popup-closed-by-user": "The Google window closed before sign-in finished.",
    "auth/popup-blocked": "Your browser blocked the Google popup.",
    "auth/operation-not-allowed": "That sign-in method is not enabled in Firebase yet.",
  };
  const key = typeof code === "string" ? code : "";
  return map[key] ?? "Something went wrong. Please try again.";
}

export default function SignInPage() {
  const router = useRouter();
  const { user, loading, configured, signInWithGoogle, signInWithEmail, signUpWithEmail } =
    useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  async function run(action: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await action();
      router.replace("/");
    } catch (e) {
      setError(friendlyError((e as { code?: string })?.code));
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-10 text-center">
        <h1 className="font-display text-3xl font-bold">Sign in is not configured yet</h1>
        <p className="text-stone-600 dark:text-stone-400">
          Copy <code className="font-mono">.env.example</code> to{" "}
          <code className="font-mono">.env.local</code>, paste your Firebase web config, and restart
          the dev server.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-6">
      <div className="text-center">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">
          {mode === "signin" ? "Welcome back" : "Create an account"}
        </h1>
        <p className="mt-2 text-stone-600 dark:text-stone-400">
          {mode === "signin"
            ? "Sign in to track how AI ranks your product."
            : "Track your rank and get notified when it moves."}
        </p>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => run(signInWithGoogle)}
        className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-stone-900 bg-white px-4 py-2.5 font-semibold shadow-[3px_3px_0_0_var(--ink)] transition-transform hover:-translate-y-0.5 disabled:opacity-60 dark:border-stone-600 dark:bg-stone-900"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.63h6.2a5.3 5.3 0 0 1-2.3 3.48v2.9h3.72c2.18-2 3.44-4.96 3.44-8.56Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.11 0 5.72-1.03 7.62-2.79l-3.72-2.89c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.54-2.03-6.45-4.75H1.71v2.98A11.5 11.5 0 0 0 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5.55 14.67a6.9 6.9 0 0 1 0-4.41V7.28H1.71a11.51 11.51 0 0 0 0 10.37l3.84-2.98Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.69 0 3.21.58 4.4 1.72l3.3-3.3C17.72 1.2 15.11 0 12 0 7.48 0 3.57 2.6 1.71 6.4l3.84 2.98C6.46 6.78 9 4.75 12 4.75Z"
          />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-stone-400">
        <span className="h-px flex-1 bg-stone-300 dark:bg-stone-700" />
        or
        <span className="h-px flex-1 bg-stone-300 dark:bg-stone-700" />
      </div>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          run(() =>
            mode === "signin"
              ? signInWithEmail(email, password)
              : signUpWithEmail({ email, password, firstName, lastName }),
          );
        }}
      >
        {mode === "signup" && (
          <div className="grid grid-cols-2 gap-3">
            <input
              className={FIELD_CLASS}
              placeholder="First name"
              autoComplete="given-name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <input
              className={FIELD_CLASS}
              placeholder="Last name"
              autoComplete="family-name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        )}
        <input
          className={FIELD_CLASS}
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className={FIELD_CLASS}
          type="password"
          placeholder="Password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="rounded-xl border-2 border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl border-2 border-stone-900 bg-emerald-500 px-4 py-2.5 font-semibold text-white shadow-[3px_3px_0_0_var(--ink)] transition-transform hover:-translate-y-0.5 disabled:opacity-60 dark:border-stone-600"
        >
          {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-stone-500">
        {mode === "signin" ? "No account yet?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
          }}
          className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
        >
          {mode === "signin" ? "Create one" : "Sign in"}
        </button>
      </p>

      <p className="text-center text-xs text-stone-400">
        <Link href="/" className="hover:underline">
          ← Back to the leaderboards
        </Link>
      </p>
    </div>
  );
}
