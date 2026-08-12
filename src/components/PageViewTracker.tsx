"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { getDb, isFirebaseConfigured } from "@/lib/firebase/client";
import { trackPageView } from "@/lib/firebase/stats";

/** Counts one page view per route change. Renders nothing. */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    // Admin work sessions would drown the real numbers.
    if (pathname.startsWith("/admin")) return;
    trackPageView(getDb()).catch(() => {
      // Rules not deployed yet, offline, ad blocker: never break the page.
    });
  }, [pathname]);

  return null;
}
