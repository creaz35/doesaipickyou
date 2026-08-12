"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function AuthMenu() {
  const { user, profile, loading, configured, isAdmin, signOut } = useAuth();
  const router = useRouter();

  if (!configured) return null;
  if (loading) return <span className="h-8 w-16 animate-pulse rounded-full bg-stone-200 dark:bg-stone-800" />;

  if (!user) {
    return (
      <Link
        href="/signin"
        className="rounded-full border-2 border-stone-900 bg-white px-3 py-1 font-semibold shadow-[2px_2px_0_0_var(--ink)] transition-transform hover:-translate-y-0.5 dark:border-stone-600 dark:bg-stone-900"
      >
        Sign in
      </Link>
    );
  }

  const label = profile?.firstName || user.email?.split("@")[0] || "Account";

  return (
    <div className="flex items-center gap-3">
      {isAdmin && (
        <Link
          href="/admin"
          className="rounded-full bg-emerald-500 px-2.5 py-0.5 font-mono text-xs font-bold uppercase tracking-wide text-white"
        >
          admin
        </Link>
      )}
      <span className="hidden text-stone-700 sm:inline dark:text-stone-300">Hi, {label}</span>
      <button
        type="button"
        onClick={async () => {
          await signOut();
          router.push("/");
        }}
        className="text-stone-500 decoration-emerald-500 decoration-wavy underline-offset-4 hover:text-stone-900 hover:underline dark:hover:text-stone-100"
      >
        Sign out
      </button>
    </div>
  );
}
