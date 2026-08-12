import { renderPrompt, TEMPLATES } from "@/data/templates";
import type { CategoryDoc, ToolDoc } from "@/lib/firebase/catalog";
import { extractMentions } from "@/lib/parser";
import { scoreCategory } from "@/lib/scoring";
import { askModel, availableModels } from "@/lib/server/llm";
import { verifyAdmin } from "@/lib/server/verify-admin";
import type { CategoryDef, ModelId, PromptRun, Snapshot } from "@/lib/types";

// One invocation runs ONE category (6 prompts × models × runs, all in
// parallel). Global runs loop categories from the admin client, keeping
// each invocation well inside serverless time limits.
export const maxDuration = 60;

// Answers are stored inside the category's snapshot doc, so cap each one
// to keep the doc far below Firestore's 1 MiB limit even at the maximum
// of 6 templates x 4 models x 5 runs.
const MAX_ANSWER_CHARS = 4000;

interface RunCategoryBody {
  category?: CategoryDoc;
  tools?: ToolDoc[];
  runsPerPrompt?: number;
  /** Which runners to use; omitted = every model with a configured key. */
  models?: ModelId[];
}

/** Tells the admin UI which runners have API keys configured. */
export async function GET(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin.ok) {
    return Response.json({ error: admin.error }, { status: admin.status });
  }
  return Response.json({ available: availableModels() });
}

export async function POST(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin.ok) {
    return Response.json({ error: admin.error }, { status: admin.status });
  }

  const available = availableModels();
  if (available.length === 0) {
    return Response.json(
      { error: "No model API keys configured. Add OPENAI_API_KEY and/or ANTHROPIC_API_KEY." },
      { status: 400 },
    );
  }

  let body: RunCategoryBody;
  try {
    body = (await request.json()) as RunCategoryBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const models =
    Array.isArray(body.models) && body.models.length > 0
      ? available.filter((m) => body.models!.includes(m))
      : available;
  if (models.length === 0) {
    return Response.json(
      { error: "None of the selected models have an API key configured." },
      { status: 400 },
    );
  }

  const { category, tools } = body;
  if (!category?.slug || !category.noun || !category.leader) {
    return Response.json({ error: "Missing or incomplete category." }, { status: 400 });
  }
  if (!Array.isArray(tools) || tools.length === 0 || tools.some((t) => !t.id || !t.aliases)) {
    return Response.json({ error: "Missing or incomplete tools list." }, { status: 400 });
  }
  if (!tools.some((t) => t.id === category.leader)) {
    return Response.json(
      { error: `Leader "${category.leader}" is not in the tools list.` },
      { status: 400 },
    );
  }

  const runsPerPrompt = Math.min(Math.max(Math.trunc(body.runsPerPrompt ?? 3), 1), 5);

  const categoryDef: CategoryDef = {
    slug: category.slug,
    emoji: category.emoji ?? "",
    name: category.name ?? category.slug,
    noun: category.noun,
    leader: category.leader,
    products: tools.map((tool) => ({
      id: tool.id,
      name: tool.name,
      url: tool.url,
      price: tool.price,
      aliases: tool.aliases,
    })),
  };

  const jobs = TEMPLATES.flatMap((template) => {
    const prompt = renderPrompt(template, categoryDef);
    return models.flatMap((model) =>
      Array.from({ length: runsPerPrompt }, (_, runIndex) => ({ template, prompt, model, runIndex })),
    );
  });

  const settled = await Promise.allSettled(
    jobs.map(async (job): Promise<PromptRun> => {
      const answer = await askModel(job.model, job.prompt);
      return {
        categorySlug: categoryDef.slug,
        templateId: job.template.id,
        prompt: job.prompt,
        model: job.model,
        runIndex: job.runIndex,
        mentions: extractMentions(answer, categoryDef),
        answer:
          answer.length > MAX_ANSWER_CHARS ? `${answer.slice(0, MAX_ANSWER_CHARS)}…` : answer,
      };
    }),
  );

  const runs = settled
    .filter((r): r is PromiseFulfilledResult<PromptRun> => r.status === "fulfilled")
    .map((r) => r.value);
  const failures = settled.filter((r) => r.status === "rejected") as PromiseRejectedResult[];

  if (runs.length === 0) {
    const reason = failures[0]?.reason instanceof Error ? failures[0].reason.message : "unknown";
    return Response.json({ error: `Every model call failed. First error: ${reason}` }, { status: 502 });
  }

  const snapshot: Snapshot = {
    id: "live",
    createdAt: new Date().toISOString(),
    models,
    runsPerPrompt,
    runs,
  };
  const scores = scoreCategory(snapshot, categoryDef);

  return Response.json({
    categorySlug: categoryDef.slug,
    runs,
    scores,
    models,
    runsPerPrompt,
    failed: failures.length,
  });
}
