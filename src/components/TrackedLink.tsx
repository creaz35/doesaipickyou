"use client";

import { getDb, isFirebaseConfigured } from "@/lib/firebase/client";
import { trackClick, type ClickKind } from "@/lib/firebase/stats";

/**
 * External link that counts its clicks (per tool or per sponsor, plus the
 * daily rollup). Fire and forget: the write races the navigation, which is
 * fine because these links open in a new tab.
 */
export function TrackedLink({
  kind,
  id,
  children,
  ...anchor
}: {
  kind: ClickKind;
  id: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...anchor}
      onClick={() => {
        if (isFirebaseConfigured) trackClick(getDb(), kind, id).catch(() => {});
      }}
    >
      {children}
    </a>
  );
}
