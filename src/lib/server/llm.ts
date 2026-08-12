import Anthropic from "@anthropic-ai/sdk";
import type { ModelId } from "@/lib/types";

/**
 * Which models a snapshot runs against is decided by which API keys are
 * present. Model ids are env-overridable so upgrades don't need a deploy
 * of code changes.
 */
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-5-mini";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5";

export function availableModels(): ModelId[] {
  const models: ModelId[] = [];
  if (process.env.OPENAI_API_KEY) models.push("openai");
  if (process.env.ANTHROPIC_API_KEY) models.push("anthropic");
  return models;
}

let anthropicClient: Anthropic | null = null;
function getAnthropic(): Anthropic {
  // 45s per call + 1 retry stays inside the route's 60s budget because
  // calls run in parallel, not sequentially.
  anthropicClient ??= new Anthropic({ timeout: 45_000, maxRetries: 1 });
  return anthropicClient;
}

/** Server-side fallbacks only apply to models that carry safety classifiers. */
const ANTHROPIC_FALLBACKS_SUPPORTED = /opus-5|fable-5/.test(ANTHROPIC_MODEL);

async function askAnthropic(prompt: string): Promise<string> {
  const client = getAnthropic();
  const base = {
    model: ANTHROPIC_MODEL,
    max_tokens: 1024,
    messages: [{ role: "user" as const, content: prompt }],
  };

  // fallbacks: "default" re-runs a classifier-declined request on the
  // recommended substitute model server-side, so a stray refusal doesn't
  // hole the snapshot. Buying-intent prompts should never trip it.
  const response = ANTHROPIC_FALLBACKS_SUPPORTED
    ? await client.beta.messages.create({
        ...base,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      })
    : await client.messages.create(base);

  if (response.stop_reason === "refusal") {
    throw new Error("The model declined this prompt.");
  }
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

async function askOpenAI(prompt: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI ${response.status}: ${body.slice(0, 200)}`);
  }
  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenAI returned an empty answer.");
  return text;
}

/** Ask one model one buying question, returning its raw answer text. */
export async function askModel(model: ModelId, prompt: string): Promise<string> {
  if (model === "anthropic") return askAnthropic(prompt);
  if (model === "openai") return askOpenAI(prompt);
  throw new Error(`Model "${model}" is not wired up yet.`);
}
