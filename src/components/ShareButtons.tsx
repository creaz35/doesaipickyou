"use client";

import { useState } from "react";

/**
 * Share row for tool pages. The live score rides in the prewritten TEXT,
 * composed at click time, while the page's cached OG image stays
 * score-free: platforms cache images for weeks, but nobody caches your
 * tweet draft. So the number shared is always the number that's true.
 */

export interface ShareStat {
  visibility: number;
  rank: number;
  total: number;
  categoryName: string;
}

function shareText(name: string, stat: ShareStat | null): string {
  if (!stat) return `Does AI pick ${name}? Find out:`;
  if (stat.visibility === 0) {
    return `Does AI pick ${name}? Nope. 0/100 AI visibility this month, completely invisible 👻`;
  }
  const medal = stat.rank === 1 ? " 🏆" : "";
  return `Does AI pick ${name}? ${stat.visibility}/100 AI visibility, #${stat.rank} of ${stat.total} in ${stat.categoryName.toLowerCase()}${medal}`;
}

const BTN =
  "rounded-full border-2 border-stone-300 bg-white px-3 py-1 font-mono text-xs font-semibold text-stone-700 transition-all hover:-translate-y-0.5 hover:border-stone-900 hover:shadow-[2px_2px_0_0_var(--ink)] dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-400";

export function ShareButtons({
  name,
  productId,
  stat,
}: {
  name: string;
  productId: string;
  stat: ShareStat | null;
}) {
  const [copied, setCopied] = useState(false);

  const url = `https://doesaipickyou.com/${productId}`;
  const text = shareText(name, stat);
  const openPopup = (href: string) =>
    window.open(href, "_blank", "noopener,noreferrer,width=600,height=600");

  const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400">
        Share
      </span>
      <button
        type="button"
        onClick={() =>
          openPopup(
            `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
          )
        }
        className={BTN}
      >
        𝕏 Post
      </button>
      <button
        type="button"
        onClick={() =>
          openPopup(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
          )
        }
        className={BTN}
      >
        LinkedIn
      </button>
      <button
        type="button"
        onClick={() =>
          openPopup(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)
        }
        className={BTN}
      >
        Facebook
      </button>
      <button
        type="button"
        onClick={() =>
          openPopup(
            `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
          )
        }
        className={BTN}
      >
        Reddit
      </button>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(`${text} ${url}`).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          });
        }}
        className={BTN}
      >
        {copied ? "✓ Copied" : "🔗 Copy"}
      </button>
      {canNativeShare && (
        <button
          type="button"
          onClick={() => void navigator.share({ title: text, text, url }).catch(() => {})}
          className={`${BTN} sm:hidden`}
        >
          📲 More
        </button>
      )}
    </div>
  );
}
