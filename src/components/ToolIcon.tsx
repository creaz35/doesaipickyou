"use client";

import { useState } from "react";

/** Favicon from the tool's own domain, with a letter tile fallback. */
export function ToolIcon({
  name,
  url,
  size = 32,
  className = "",
}: {
  name: string;
  url: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const domain = new URL(url).hostname;

  if (failed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-lg bg-stone-100 font-mono font-semibold text-stone-500 dark:bg-stone-800 ${className}`}
        style={{ width: size, height: size }}
      >
        {name[0]?.toUpperCase()}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- external favicon service, no optimization needed
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=${size > 32 ? 128 : 64}`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-lg ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
