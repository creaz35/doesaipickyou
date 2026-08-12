/** Badge for tools with a zero visibility score. The ghost floats. */
export function InvisibleBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950 dark:text-rose-300">
      <span
        aria-hidden="true"
        className="inline-block animate-[ghost-float_2s_ease-in-out_infinite] motion-reduce:animate-none"
      >
        👻
      </span>
      invisible
    </span>
  );
}
