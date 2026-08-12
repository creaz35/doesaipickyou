# [doesaipickyou.com](https://doesaipickyou.com)

**Does AI pick you?** We ask ChatGPT, Claude, Gemini and Perplexity the questions your buyers actually ask, like *"best form builder for a solo founder"* and *"alternatives to Mailchimp"*, and track which products they recommend. Public monthly leaderboards of AI visibility for indie SaaS.

**→ See the live leaderboards at [doesaipickyou.com](https://doesaipickyou.com)**

## How it works

1. **Prompts**: six fixed templates ([src/data/templates.ts](src/data/templates.ts)) applied identically to every category, so scores are comparable across categories.
2. **Runs**: each prompt runs 3× per model per monthly snapshot to smooth out nondeterminism.
3. **Parsing**: answers are matched against a hand-curated alias table per category ([src/data/categories.ts](src/data/categories.ts)). Exact word-boundary matches only, no fuzzy matching. Common-word product names ("Later", "Linear", "Wave") match case-sensitively. On prompts that name the category leader ("alternatives to X"), the leader itself is excluded from both counting and its own denominator: an answer echoing the question is not a recommendation.
4. **Scoring**: a mention is weighted by its position in the answer (1st = 1.0 down to 0.4 for 6th and later), averaged over all runs, ×100. See [src/lib/scoring.ts](src/lib/scoring.ts).
5. **Snapshots**: one dated JSON per month in `data/snapshots/`, committed to the repo, never overwritten. The history is the asset.

## Development

```bash
npm install
npm run snapshot:mock   # generate deterministic sample data (labeled as mock in the UI)
npm run dev
```

The site is fully static: pages read the latest snapshot from `data/snapshots/` at build time.

## Auth (Firebase)

Accounts are optional for browsing; the leaderboards are public. Sign-in exists for
the account features (rank alerts, admin).

1. Create a Firebase project, add a **Web app**, and copy its config.
2. `cp .env.example .env.local` and paste the values in. Restart the dev server:
   `NEXT_PUBLIC_` vars are inlined at build time.
3. In the console, enable **Authentication → Sign-in method → Google** and
   **Email/Password**.
4. Create a **Firestore** database, then deploy the rules:
   `firebase deploy --only firestore:rules`

New accounts get `role: "user"` in the `users` collection. To grant admin, edit that
user's document in the Firestore console and set `role: "admin"` — `firestore.rules`
blocks clients from writing their own role, so this is deliberately a console-only
action.

With no Firebase config present the site still builds and runs; the sign-in UI just
stays hidden.

## Contributing

**Want your tool on the leaderboards?** Add it to `src/data/categories.ts` in a PR, or open an [Add a tool](../../issues/new?template=add-tool.yml) issue if PRs aren't your thing. Full instructions, including the alias rules that decide your score, are in [CONTRIBUTING.md](CONTRIBUTING.md).

The highest-value contributions are data fixes, not features: missing aliases, missing products, new categories. Prompt templates and position weights are published methodology; changing them invalidates historical comparisons, so they only change with a very good reason.

## Roadmap

- [x] Real model runner (OpenAI + Anthropic; run from /admin per category, per tool, or globally)
- [ ] Product pages with month-over-month trend
- [ ] `/invisible`: products never mentioned in their own category
- [ ] `/movers`: biggest monthly gains and drops
- [ ] "Check my product" live URL checker
- [ ] Embeddable rank badge

## License

MIT
