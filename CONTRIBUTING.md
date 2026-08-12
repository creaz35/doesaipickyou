# Contributing

The most valuable contributions here are **data, not features**: adding your tool, fixing an alias, proposing a category. The catalog lives in code, so a pull request is both the submission and the review queue. Merged = approved.

## Add your tool

1. Fork the repo and edit [`src/data/categories.ts`](src/data/categories.ts).
2. Find the category your tool competes in and add an entry to its `products` array:

```ts
{
  id: "yourtool",              // stable forever: kebab-case, never renamed (history keys on it)
  name: "YourTool",
  url: "https://yourtool.com", // plain homepage, no UTM parameters
  price: "Free + $9/mo",       // short human string: "Free", "$29/mo", "$89 once"
  aliases: ["YourTool", "Your Tool"],
},
```

3. Open a PR titled `Add YourTool to <category>`. One tool per PR, please.

### The alias rules (please read, they decide your score)

- Aliases are the **complete** list of strings that count as a mention. The `name` field is NOT matched automatically, so include it as an alias.
- Matching is exact, word-boundary, no fuzzy matching, ever. If ChatGPT calls you "YT Builder" and that alias is missing, the mention does not count.
- If your product name is a common English word ("Later", "Linear", "Wave"), mark it case-sensitive so everyday sentences don't count as mentions:

```ts
aliases: [{ text: "Later", caseSensitive: true }, "later.com"],
```

- Aliases that would inflate your score get the PR rejected: competitor names, generic phrases ("form builder"), or overly loose spellings. The whole point of this site is that the numbers are honest.

### What happens after the merge

The maintainer syncs the catalog into the live database and includes your tool in the category's next snapshot run. Your product page (`doesaipickyou.com/yourtool`) appears with the next deploy, and your first scores with the next run, worst case the next monthly snapshot. Patience: being on the list is instant, being ranked follows the calendar.

## Fix a missing alias

The single best small PR. If a raw answer (the 💬 buttons on any tool page) clearly names a product and the mention wasn't counted, an alias is missing. One line in `src/data/categories.ts`, and the next snapshot catches it.

## Propose a new category

A category is a set of buyer questions, so it needs to make sense as one:

- At least 6 to 8 real competitors (a leaderboard of 3 is not a leaderboard).
- A natural singular noun that reads well in "best `<noun>` for a solo founder".
- An obvious incumbent for "alternatives to `<leader>`".

Open an issue first to discuss it; categories are cheap to add but awkward to remove.

## Not comfortable with PRs?

Open an issue using the **Add a tool** template with the same fields, and it gets added manually. PRs just skip the queue.

## Rather not merge conflicts of interest?

Adding your own product is welcome and expected, that is what the site is for. Review exists to keep the aliases honest, not to gatekeep who gets listed. Sponsorship is a separate thing entirely and never affects rankings.

## What will not be merged

- Changes to prompt templates or position weights: they are published methodology, and changing them invalidates every historical comparison. They only change with a very good reason and a version note.
- Fake or unreachable products, parked domains, or affiliate redirects as the `url`.
- Renaming an existing `id` (breaks history) — fix the `name` instead.

## Code contributions

Bug fixes and roadmap features are welcome too:

```bash
npm install
npm run snapshot:mock   # deterministic sample data, no Firebase needed
npm run dev
```

The site runs fully on mock data without any Firebase config. Before opening a PR, make sure `npm run build` and `npm run lint` pass. Match the style around you; the codebase favors small server components and boring, readable code.
