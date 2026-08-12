import { escapeRegExp } from "@/lib/parser";
import { MODEL_LABELS, type ProductDef, type PromptRun } from "@/lib/types";

/**
 * The raw model answers behind one prompt row on a product page. Model
 * output is markdown-ish (bold, numbered lists), so a tiny renderer turns
 * the common constructs into real elements instead of showing literal
 * asterisks, and every occurrence of the product's aliases is highlighted.
 * Server-rendered; the expand/collapse around it is a native <details>.
 */

/** Same alias semantics as the parser: word boundaries, per-alias case. */
function findAliasRanges(text: string, product: ProductDef): { start: number; end: number }[] {
  const ranges: { start: number; end: number }[] = [];
  for (const alias of product.aliases) {
    const { text: aliasText, caseSensitive } =
      typeof alias === "string" ? { text: alias, caseSensitive: false } : alias;
    const re = new RegExp(`\\b${escapeRegExp(aliasText)}\\b`, caseSensitive ? "g" : "gi");
    for (const m of text.matchAll(re)) {
      ranges.push({ start: m.index, end: m.index + m[0].length });
    }
  }
  return ranges;
}

/** True when TODAY'S alias table finds the product in this answer. */
export function answerNamesProduct(text: string, product: ProductDef): boolean {
  return findAliasRanges(text, product).length > 0;
}

function highlightAliases(text: string, product: ProductDef): React.ReactNode {
  const ranges = findAliasRanges(text, product);
  if (ranges.length === 0) return text;

  ranges.sort((a, b) => a.start - b.start || b.end - a.end);
  const merged: { start: number; end: number }[] = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end) last.end = Math.max(last.end, range.end);
    else merged.push({ ...range });
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  merged.forEach((range, i) => {
    if (range.start > cursor) parts.push(text.slice(cursor, range.start));
    parts.push(
      <mark
        key={i}
        className="rounded bg-emerald-200 px-0.5 font-semibold text-emerald-950 dark:bg-emerald-800 dark:text-emerald-50"
      >
        {text.slice(range.start, range.end)}
      </mark>,
    );
    cursor = range.end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

/** Inline markdown: **bold** and `code`, with aliases highlighted inside. */
function renderInline(text: string, product: ProductDef): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const tokenRe = /(\*\*[^*]+?\*\*|`[^`]+?`)/g;
  let cursor = 0;
  let key = 0;
  for (const m of text.matchAll(tokenRe)) {
    if (m.index > cursor) {
      nodes.push(<span key={key++}>{highlightAliases(text.slice(cursor, m.index), product)}</span>);
    }
    const token = m[0];
    if (token.startsWith("**")) {
      nodes.push(
        <strong key={key++} className="font-semibold">
          {highlightAliases(token.slice(2, -2), product)}
        </strong>,
      );
    } else {
      nodes.push(
        <code
          key={key++}
          className="rounded bg-stone-100 px-1 font-mono text-[0.85em] dark:bg-stone-800"
        >
          {token.slice(1, -1)}
        </code>,
      );
    }
    cursor = m.index + token.length;
  }
  if (cursor < text.length) {
    nodes.push(<span key={key++}>{highlightAliases(text.slice(cursor), product)}</span>);
  }
  return nodes;
}

type Block =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "ol"; items: string[] }
  | { type: "ul"; items: string[] };

function parseBlocks(answer: string): Block[] {
  // Markdown links read badly in a quote; keep the label, drop the URL.
  const text = answer.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");

  const blocks: Block[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || /^[-*_]{3,}$/.test(line)) continue;

    const ol = line.match(/^\d+[.)]\s+(.*)$/);
    const ul = line.match(/^[-*•]\s+(.*)$/);
    const heading = line.match(/^#{1,4}\s+(.*)$/);
    const last = blocks[blocks.length - 1];

    if (ol) {
      if (last?.type === "ol") last.items.push(ol[1]);
      else blocks.push({ type: "ol", items: [ol[1]] });
    } else if (ul) {
      if (last?.type === "ul") last.items.push(ul[1]);
      else blocks.push({ type: "ul", items: [ul[1]] });
    } else if (heading) {
      blocks.push({ type: "h", text: heading[1] });
    } else {
      blocks.push({ type: "p", text: line });
    }
  }
  return blocks;
}

function AnswerBody({ answer, product }: { answer: string; product: ProductDef }) {
  return (
    <div className="max-h-80 space-y-2.5 overflow-y-auto pr-1 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
      {parseBlocks(answer).map((block, i) => {
        if (block.type === "ol" || block.type === "ul") {
          const List = block.type === "ol" ? "ol" : "ul";
          return (
            <List
              key={i}
              className={`space-y-1.5 pl-5 marker:text-stone-400 ${
                block.type === "ol" ? "list-decimal" : "list-disc"
              }`}
            >
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item, product)}</li>
              ))}
            </List>
          );
        }
        if (block.type === "h") {
          return (
            <p key={i} className="pt-1 font-semibold text-stone-900 dark:text-stone-100">
              {renderInline(block.text, product)}
            </p>
          );
        }
        return <p key={i}>{renderInline(block.text, product)}</p>;
      })}
    </div>
  );
}

export function AnswersPanel({ runs, product }: { runs: PromptRun[]; product: ProductDef }) {
  return (
    <div className="mt-3 space-y-3 rounded-2xl border-2 border-stone-200 bg-stone-50 p-3 sm:p-4 dark:border-stone-800 dark:bg-stone-900/50">
      {runs.map((run) => {
        const mention = run.mentions.find((m) => m.productId === product.id);
        // Named by today's aliases but not counted at run time: the tool
        // (or the alias) was added to the catalog after this run happened.
        const missedByRun = !mention && answerNamesProduct(run.answer ?? "", product);
        return (
          <article
            key={`${run.model}-${run.runIndex}`}
            className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950"
          >
            <header className="mb-3 flex flex-wrap items-center gap-2 border-b border-stone-100 pb-2.5 text-xs dark:border-stone-900">
              <span className="rounded-md border border-stone-300 bg-white px-1.5 py-0.5 font-mono font-medium dark:border-stone-700 dark:bg-stone-900">
                {MODEL_LABELS[run.model] ?? run.model}
              </span>
              <span className="font-mono text-stone-400">run {run.runIndex + 1}</span>
              <span className="flex-1" />
              {mention ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-mono text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  named #{mention.position}
                </span>
              ) : missedByRun ? (
                <span
                  className="rounded-full bg-amber-100 px-2 py-0.5 font-mono text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  title="The answer names it, but this tool (or alias) joined the catalog after this run, so the run did not count it. The next run will."
                >
                  ⏳ named, not counted yet
                </span>
              ) : (
                <span className="rounded-full bg-stone-100 px-2 py-0.5 font-mono text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                  👻 not named
                </span>
              )}
            </header>
            <AnswerBody answer={run.answer ?? ""} product={product} />
          </article>
        );
      })}
    </div>
  );
}
