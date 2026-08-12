"use client";

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ToolIcon } from "@/components/ToolIcon";
import { useAuth } from "@/lib/auth-context";
import {
  deleteToolEverywhere,
  fetchCategoryDocs,
  fetchToolDocs,
  saveCategoryDoc,
  saveToolDoc,
  seedCatalogFromStatic,
  type CategoryDoc,
  type ToolDoc,
} from "@/lib/firebase/catalog";
import { getDb } from "@/lib/firebase/client";
import { saveCategoryRunResult, type CategoryRunResult } from "@/lib/firebase/results";
import {
  activateSponsor,
  fetchSponsorPriceUsd,
  fetchSponsors,
  removeSponsor,
  saveSponsorPriceUsd,
  setSponsorRenewal,
} from "@/lib/firebase/sponsors";
import { fetchClickCounts } from "@/lib/firebase/stats";
import { fetchSubscribers, type Subscriber } from "@/lib/firebase/subscribers";
import { USERS_COLLECTION, type UserProfile } from "@/lib/firebase/users";
import {
  railSpots,
  RENEWAL_LABELS,
  sponsorIsActive,
  spotLabel,
  type RailSide,
  type RenewalStatus,
  type SponsorInfo,
  type SponsorPurchase,
} from "@/lib/sponsor-spots";
import { MODEL_LABELS, type ModelId } from "@/lib/types";

/** Runners the app knows how to call; shown as toggles, gated by API keys. */
const RUNNER_IDS: ModelId[] = ["openai", "anthropic"];
const RUNNER_KEY_HINT: Record<string, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
};

type AdminTab = "users" | "subscribers" | "sponsors" | "categories" | "tools" | "settings";

const TABS: { id: AdminTab; label: string }[] = [
  { id: "users", label: "👤 Users" },
  { id: "subscribers", label: "📬 Subscribers" },
  { id: "sponsors", label: "🪧 Sponsors" },
  { id: "categories", label: "🗂️ Categories" },
  { id: "tools", label: "🛠️ Tools" },
  { id: "settings", label: "⚙️ Settings" },
];

const EMPTY_NEW_TOOL = {
  name: "",
  id: "",
  url: "",
  price: "",
  aliases: "",
  categorySlugs: [] as string[],
};

const EMPTY_NEW_CATEGORY = {
  name: "",
  slug: "",
  emoji: "",
  noun: "",
  leader: "",
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const INPUT_CLASS =
  "w-full rounded-xl border-2 border-stone-900 bg-white px-3 py-2 text-sm outline-none transition-all placeholder:text-stone-400 focus:-translate-y-0.5 focus:shadow-[2px_2px_0_0_var(--ink)] dark:border-stone-600 dark:bg-stone-950";

const TH_CLASS = "py-2 pr-4 font-medium";
const HEAD_ROW_CLASS =
  "border-b-2 border-stone-900 text-left font-mono text-[10px] uppercase tracking-widest text-stone-500 dark:border-stone-700";
const ROW_CLASS = "border-b border-stone-200/70 dark:border-stone-800/70";

export default function AdminPage() {
  const { user, profile, loading, configured, isAdmin } = useAuth();

  const [tab, setTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<UserProfile[] | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[] | null>(null);
  const [categories, setCategories] = useState<CategoryDoc[] | null>(null);
  const [tools, setTools] = useState<ToolDoc[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [configuredRunners, setConfiguredRunners] = useState<ModelId[] | null>(null);
  const [selectedRunners, setSelectedRunners] = useState<ModelId[]>([]);
  const [sponsors, setSponsors] = useState<SponsorInfo[] | null>(null);
  const [purchases, setPurchases] = useState<SponsorPurchase[] | null>(null);
  const [purchasesError, setPurchasesError] = useState<string | null>(null);
  const [priceUsd, setPriceUsd] = useState<number | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceMessage, setPriceMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({});
  const [showAddTool, setShowAddTool] = useState(false);
  const [newTool, setNewTool] = useState({ ...EMPTY_NEW_TOOL });
  const [idEdited, setIdEdited] = useState(false);
  const [editingToolId, setEditingToolId] = useState<string | null>(null);
  const [addToolError, setAddToolError] = useState<string | null>(null);
  const [addingTool, setAddingTool] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ ...EMPTY_NEW_CATEGORY });
  const [slugEdited, setSlugEdited] = useState(false);
  const [addCategoryError, setAddCategoryError] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const db = getDb();
      const [userSnap, subscriberDocs, categoryDocs, toolDocs, sponsorDocs, price, clicks] =
        await Promise.all([
          getDocs(query(collection(db, USERS_COLLECTION), orderBy("createdAt", "desc"))),
          fetchSubscribers(db),
          fetchCategoryDocs(db),
          fetchToolDocs(db),
          fetchSponsors(db),
          fetchSponsorPriceUsd(db),
          fetchClickCounts(db),
        ]);
      setUsers(userSnap.docs.map((d) => d.data() as UserProfile));
      setSubscribers(subscriberDocs);
      setCategories(categoryDocs);
      setTools(toolDocs);
      setSponsors(sponsorDocs);
      setPriceUsd(price);
      setPriceInput(price ? String(price) : "");
      setClickCounts(clicks);
      setLoadError(null);
    } catch {
      setLoadError("Could not load data. Check that firestore.rules is deployed.");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; every setState in loadAll happens after an await
    if (isAdmin) void loadAll();
  }, [isAdmin, loadAll]);

  // Ask the server which runners have API keys; select them all by default.
  useEffect(() => {
    if (!isAdmin || !user) return;
    void (async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/run-category", {
          headers: { authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = (await response.json()) as { available: ModelId[] };
        setConfiguredRunners(data.available);
        setSelectedRunners(data.available);
      } catch {
        setConfiguredRunners([]);
      }
    })();
  }, [isAdmin, user]);

  // Paid sponsor checkouts, straight from Stripe (server route, admin only).
  useEffect(() => {
    if (!isAdmin || !user) return;
    void (async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/sponsor/purchases", {
          headers: { authorization: `Bearer ${token}` },
        });
        const data = (await response.json()) as { purchases?: SponsorPurchase[]; error?: string };
        if (!response.ok) {
          setPurchases([]);
          setPurchasesError(data.error ?? `HTTP ${response.status}`);
          return;
        }
        setPurchases(data.purchases ?? []);
        setPurchasesError(null);
      } catch {
        setPurchases([]);
        setPurchasesError("Could not reach Stripe.");
      }
    })();
  }, [isAdmin, user]);

  function appendLog(line: string) {
    setLog((prev) => [...prev.slice(-199), line]);
  }

  /** Runs one category through /api/run-category and persists the result. */
  async function runCategory(category: CategoryDoc): Promise<void> {
    const categoryTools = (tools ?? []).filter((t) => t.categorySlugs.includes(category.slug));
    if (categoryTools.length === 0) {
      appendLog(`⚠️ ${category.name}: no tools in Firestore. Sync the catalog first.`);
      return;
    }
    appendLog(
      `▶ ${category.emoji} ${category.name}: asking ${selectedRunners
        .map((m) => MODEL_LABELS[m])
        .join(" + ")}…`,
    );
    try {
      const token = await user!.getIdToken();
      const response = await fetch("/api/run-category", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          category,
          tools: categoryTools,
          runsPerPrompt: 3,
          models: selectedRunners,
        }),
      });
      const data = (await response.json()) as CategoryRunResult & { error?: string };
      if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`);

      const snapshotId = new Date().toISOString().slice(0, 7);
      await saveCategoryRunResult(getDb(), snapshotId, data);

      const top = data.scores[0];
      appendLog(
        `✅ ${category.name}: ${data.runs.length} runs saved` +
          (data.failed ? ` (${data.failed} calls failed)` : "") +
          (top ? `. Top: ${top.name} at ${top.visibility}.` : "."),
      );
    } catch (e) {
      appendLog(`❌ ${category.name}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  async function runCategories(list: CategoryDoc[], key: string) {
    if (list.length === 0) return;
    setRunning(key);
    try {
      for (const category of list) {
        await runCategory(category);
      }
      appendLog(`🏁 Done (${list.length} ${list.length === 1 ? "category" : "categories"}).`);
      await loadAll();
    } finally {
      setRunning(null);
    }
  }

  async function syncCatalog() {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const result = await seedCatalogFromStatic(getDb());
      setSyncMessage(`✅ Imported ${result.categories} categories and ${result.tools} tools.`);
      await loadAll();
    } catch {
      setSyncMessage("❌ Sync failed. Are the latest firestore.rules deployed?");
    } finally {
      setSyncing(false);
    }
  }

  /** Publishes a paid Stripe purchase into its rail spot. */
  async function activatePurchase(purchase: SponsorPurchase) {
    setBusyId(purchase.sessionId);
    try {
      await activateSponsor(getDb(), {
        sessionId: purchase.sessionId,
        spot: purchase.spot,
        name: purchase.name,
        tagline: purchase.tagline,
        url: purchase.url,
        amountUsd: purchase.amountUsd,
      });
      appendLog(`🪧 ${purchase.name} is live on ${spotLabel(purchase.spot).toLowerCase()}.`);
      await loadAll();
    } catch {
      appendLog(`❌ Could not activate ${purchase.name}. Are the latest firestore.rules deployed?`);
    } finally {
      setBusyId(null);
    }
  }

  async function unpublishSponsor(sponsor: SponsorInfo) {
    if (!window.confirm(`Take ${sponsor.name} off ${spotLabel(sponsor.spot).toLowerCase()}?`)) {
      return;
    }
    setBusyId(sponsor.sessionId);
    try {
      await removeSponsor(getDb(), sponsor.sessionId);
      appendLog(`🗑️ Removed ${sponsor.name}. The purchase stays in Stripe for re-activation.`);
      await loadAll();
    } catch {
      appendLog(`❌ Could not remove ${sponsor.name}.`);
    } finally {
      setBusyId(null);
    }
  }

  async function addTool() {
    const name = newTool.name.trim();
    const id = newTool.id.trim();
    const price = newTool.price.trim();
    const rawUrl = newTool.url.trim();
    const aliases = newTool.aliases
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean)
      .map((a) =>
        a.endsWith("!")
          ? { text: a.slice(0, -1).trim(), caseSensitive: true }
          : { text: a, caseSensitive: false },
      )
      .filter((a) => a.text.length > 0);

    let url = "";
    try {
      const parsed = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
      if (parsed.hostname.includes(".")) url = parsed.toString();
    } catch {
      // caught by the !url check below
    }

    if (!name) return setAddToolError("Name is required.");
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
      return setAddToolError("Id must be lowercase letters, digits and dashes.");
    }
    if (!editingToolId && (tools ?? []).some((t) => t.id === id)) {
      return setAddToolError(`Id "${id}" is already taken.`);
    }
    if (!url) return setAddToolError("Enter a valid website URL.");
    if (!price) return setAddToolError('Price is required (e.g. "Free + $9/mo").');
    if (aliases.length === 0) return setAddToolError("At least one alias is required.");
    if (newTool.categorySlugs.length === 0) {
      return setAddToolError("Pick at least one category.");
    }

    setAddingTool(true);
    setAddToolError(null);
    try {
      await saveToolDoc(getDb(), {
        id,
        name,
        url,
        price,
        aliases,
        categorySlugs: newTool.categorySlugs,
      });
      appendLog(
        editingToolId
          ? `✏️ ${name} updated (${aliases.length} ${aliases.length === 1 ? "alias" : "aliases"}, ${newTool.categorySlugs.length} ${newTool.categorySlugs.length === 1 ? "category" : "categories"}). Mirror the change in src/data/categories.ts when you get a chance.`
          : `🆕 ${name} added (${aliases.length} ${aliases.length === 1 ? "alias" : "aliases"}, ` +
              `${newTool.categorySlugs.length} ${newTool.categorySlugs.length === 1 ? "category" : "categories"}). ` +
              "Hit ▶ on its category to rank it. Add it to src/data/categories.ts too, so the open dataset and /models stay in sync.",
      );
      setNewTool({ ...EMPTY_NEW_TOOL });
      setIdEdited(false);
      setEditingToolId(null);
      setShowAddTool(false);
      await loadAll();
    } catch {
      setAddToolError("Save failed. Are the latest firestore.rules deployed?");
    } finally {
      setAddingTool(false);
    }
  }

  async function addCategory() {
    const name = newCategory.name.trim();
    const slug = newCategory.slug.trim();
    const emoji = newCategory.emoji.trim();
    const noun = newCategory.noun.trim();
    const leader = newCategory.leader;

    if (!name) return setAddCategoryError("Name is required (plural, e.g. Form builders).");
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
      return setAddCategoryError("Slug must be lowercase letters, digits and dashes.");
    }
    if ((categories ?? []).some((c) => c.slug === slug)) {
      return setAddCategoryError(`Slug "${slug}" is already taken.`);
    }
    if (!emoji || emoji.length > 8) return setAddCategoryError("Pick one emoji.");
    if (!noun) return setAddCategoryError("Noun is required (singular, e.g. form builder).");
    if (!leader) return setAddCategoryError("Pick the leader tool.");

    setAddingCategory(true);
    setAddCategoryError(null);
    try {
      await saveCategoryDoc(getDb(), { slug, emoji, name, noun, leader });
      appendLog(
        `🆕 ${emoji} ${name} added. Now put tools in it (edit existing tools or add new ones), ` +
          "then hit ▶ to run it. Add it to src/data/categories.ts too, so the open dataset and /models stay in sync.",
      );
      setNewCategory({ ...EMPTY_NEW_CATEGORY });
      setSlugEdited(false);
      setShowAddCategory(false);
      await loadAll();
    } catch {
      setAddCategoryError("Save failed. Are the latest firestore.rules deployed?");
    } finally {
      setAddingCategory(false);
    }
  }

  function startEditTool(tool: ToolDoc) {
    setNewTool({
      name: tool.name,
      id: tool.id,
      url: tool.url,
      price: tool.price,
      aliases: tool.aliases.map((a) => (a.caseSensitive ? `${a.text}!` : a.text)).join(", "),
      categorySlugs: [...tool.categorySlugs],
    });
    setIdEdited(true);
    setEditingToolId(tool.id);
    setAddToolError(null);
    setShowAddTool(true);
  }

  async function deleteTool(tool: ToolDoc) {
    const confirmed = window.confirm(
      `Delete ${tool.name} from Firestore?\n\n` +
        "It leaves the leaderboards within the hour. While it is still in " +
        'src/data/categories.ts, "Sync catalog from code" brings it back; ' +
        "remove it from code to make this permanent.",
    );
    if (!confirmed) return;
    setBusyId(tool.id);
    try {
      await deleteToolEverywhere(getDb(), tool.id, categories ?? []);
      appendLog(`🗑️ ${tool.name} deleted from Firestore (tool doc + category scores).`);
      await loadAll();
    } catch {
      appendLog(`❌ Could not delete ${tool.name}.`);
    } finally {
      setBusyId(null);
    }
  }

  /** Records what the sponsor plans to do when their 30 days end. */
  async function updateRenewal(sponsor: SponsorInfo, renewal: RenewalStatus | null) {
    setBusyId(sponsor.sessionId);
    try {
      await setSponsorRenewal(getDb(), sponsor.sessionId, renewal);
      appendLog(
        `📝 ${sponsor.name}: ${renewal ? RENEWAL_LABELS[renewal] : "status cleared"}. Shown on /sponsor within 5 minutes.`,
      );
      await loadAll();
    } catch {
      appendLog(`❌ Could not update ${sponsor.name}.`);
    } finally {
      setBusyId(null);
    }
  }

  async function savePrice() {
    const value = Math.round(Number(priceInput));
    if (!Number.isFinite(value) || value < 1) {
      setPriceMessage("Enter a whole-dollar price of at least $1.");
      return;
    }
    setSavingPrice(true);
    setPriceMessage(null);
    try {
      await saveSponsorPriceUsd(getDb(), value);
      setPriceUsd(value);
      setPriceMessage(`✅ The next sponsor pays $${value}.`);
    } catch {
      setPriceMessage("❌ Save failed. Are the latest firestore.rules deployed?");
    } finally {
      setSavingPrice(false);
    }
  }

  if (!configured) {
    return <p className="py-10 text-center text-stone-500">Firebase is not configured yet.</p>;
  }

  if (loading) {
    return <p className="py-10 text-center text-stone-500">Checking your access…</p>;
  }

  // Gate is client-side for UX. The real boundary is firestore.rules, which
  // rejects catalog writes and user listing for non-admins.
  if (!user) {
    return (
      <div className="space-y-4 py-10 text-center">
        <h1 className="font-display text-3xl font-bold">Admins only</h1>
        <p className="text-stone-600 dark:text-stone-400">You need to sign in first.</p>
        <Link
          href="/signin"
          className="inline-block rounded-xl border-2 border-stone-900 bg-white px-4 py-2 font-semibold shadow-[3px_3px_0_0_var(--ink)] transition-transform hover:-translate-y-0.5 dark:border-stone-600 dark:bg-stone-900"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-4 py-10 text-center">
        <h1 className="font-display text-3xl font-bold">🔒 Admins only</h1>
        <p className="text-stone-600 dark:text-stone-400">
          You are signed in as {profile?.email ?? user.email}, which has the{" "}
          <span className="font-mono">{profile?.role ?? "user"}</span> role.
        </p>
        <Link href="/" className="inline-block text-emerald-600 hover:underline dark:text-emerald-400">
          ← Back to the leaderboards
        </Link>
      </div>
    );
  }

  const toolCountByCategory = new Map<string, number>();
  for (const tool of tools ?? []) {
    for (const slug of tool.categorySlugs) {
      toolCountByCategory.set(slug, (toolCountByCategory.get(slug) ?? 0) + 1);
    }
  }
  const categoryBySlug = new Map((categories ?? []).map((c) => [c.slug, c]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Admin</h1>
          <p className="mt-2 text-stone-600 dark:text-stone-400">Signed in as {profile?.email}.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={syncing || running !== null}
            onClick={() => void syncCatalog()}
            className="rounded-xl border-2 border-stone-900 bg-white px-4 py-2 text-sm font-semibold shadow-[3px_3px_0_0_var(--ink)] transition-transform hover:-translate-y-0.5 disabled:opacity-60 dark:border-stone-600 dark:bg-stone-900"
          >
            {syncing ? "Syncing…" : "⟳ Sync catalog from code"}
          </button>
          <button
            type="button"
            disabled={
              syncing || running !== null || !categories?.length || selectedRunners.length === 0
            }
            onClick={() => void runCategories(categories ?? [], "all")}
            className="rounded-xl border-2 border-stone-900 bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-[3px_3px_0_0_var(--ink)] transition-transform hover:-translate-y-0.5 disabled:opacity-60 dark:border-stone-600"
          >
            {running === "all" ? "Running…" : "▶ Run snapshot (all categories)"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500">
          Runners
        </span>
        {RUNNER_IDS.map((model) => {
          const configured = configuredRunners?.includes(model) ?? false;
          const active = selectedRunners.includes(model);
          return (
            <button
              key={model}
              type="button"
              disabled={!configured || running !== null}
              title={configured ? undefined : `Add ${RUNNER_KEY_HINT[model]} to .env.local to enable`}
              onClick={() =>
                setSelectedRunners((prev) =>
                  active ? prev.filter((m) => m !== model) : [...prev, model],
                )
              }
              className={`rounded-full border-2 px-3 py-1 text-sm transition-all disabled:opacity-40 ${
                active
                  ? "border-stone-900 bg-stone-900 font-semibold text-white shadow-[2px_2px_0_0_#10b981] dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900"
                  : "border-stone-300 bg-white text-stone-600 hover:border-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400 dark:hover:border-stone-400"
              }`}
            >
              {active ? "✓ " : ""}
              {MODEL_LABELS[model]}
              {!configured && " (no key)"}
            </button>
          );
        })}
        {selectedRunners.length === 0 && (
          <span className="text-sm text-rose-500">Select at least one runner.</span>
        )}
      </div>

      {log.length > 0 && (
        <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl border-2 border-stone-300 bg-white px-3 py-2 font-mono text-xs dark:border-stone-700 dark:bg-stone-900">
          {log.join("\n")}
        </pre>
      )}

      {syncMessage && (
        <p className="rounded-xl border-2 border-stone-300 bg-white px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-900">
          {syncMessage}
        </p>
      )}

      {loadError && (
        <p className="rounded-xl border-2 border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300">
          {loadError}
        </p>
      )}

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full border-2 px-3.5 py-1.5 text-sm transition-all ${
              tab === t.id
                ? "border-stone-900 bg-stone-900 font-semibold text-white shadow-[3px_3px_0_0_#10b981] dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900"
                : "border-stone-300 bg-white text-stone-600 hover:-translate-y-0.5 hover:border-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400 dark:hover:border-stone-400"
            }`}
          >
            {t.label}
            <span className="ml-1.5 font-mono text-xs opacity-70">
              {t.id === "users" ? users?.length ?? "…" : null}
              {t.id === "subscribers" ? subscribers?.length ?? "…" : null}
              {t.id === "sponsors"
                ? sponsors?.filter((s) => sponsorIsActive(s)).length ?? "…"
                : null}
              {t.id === "categories" ? categories?.length ?? "…" : null}
              {t.id === "tools" ? tools?.length ?? "…" : null}
            </span>
          </button>
        ))}
      </div>

      {tab === "users" && (
        <section className="overflow-x-auto">
          {users && users.length === 0 ? (
            <p className="py-8 text-center text-stone-500">No users yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className={HEAD_ROW_CLASS}>
                  <th className={TH_CLASS}>Name</th>
                  <th className={TH_CLASS}>Email</th>
                  <th className="py-2 font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {(users ?? []).map((u) => (
                  <tr key={u.uid} className={ROW_CLASS}>
                    <td className="py-2.5 pr-4">
                      {[u.firstName, u.lastName].filter(Boolean).join(" ") || "n/a"}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs">{u.email}</td>
                    <td className="py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-xs ${
                          u.role === "admin"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {tab === "subscribers" && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-stone-500">
              {subscribers?.length ?? 0} subscribers ·{" "}
              {(subscribers ?? []).filter((s) => s.source === "signup").length} from account
              signups
            </p>
            {subscribers && subscribers.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  void navigator.clipboard.writeText(subscribers.map((s) => s.email).join(", "))
                }
                className="rounded-lg border-2 border-stone-300 px-2.5 py-0.5 text-xs font-semibold transition-colors hover:border-emerald-500 dark:border-stone-700"
              >
                Copy all emails
              </button>
            )}
          </div>
          {subscribers && subscribers.length === 0 ? (
            <p className="py-8 text-center text-stone-500">No subscribers yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={HEAD_ROW_CLASS}>
                    <th className={TH_CLASS}>Email</th>
                    <th className={TH_CLASS}>Name</th>
                    <th className="py-2 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {(subscribers ?? []).map((s) => (
                    <tr key={s.email} className={ROW_CLASS}>
                      <td className="py-2.5 pr-4 font-mono text-xs">{s.email}</td>
                      <td className="py-2.5 pr-4">{s.firstName || "n/a"}</td>
                      <td className="py-2.5">
                        <span
                          className={`rounded-full px-2 py-0.5 font-mono text-xs ${
                            s.source === "signup"
                              ? "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          }`}
                        >
                          {s.source}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === "sponsors" && (
        <section className="space-y-8">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h2 className="font-display text-lg font-bold">Live spots</h2>
              <p className="text-sm text-stone-500">
                {(sponsors ?? []).filter((s) => sponsorIsActive(s)).length} of 12 live · next
                sponsor pays {priceUsd ? `$${priceUsd}` : "nothing, no price set (see Settings)"}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["left", "right"] as RailSide[]).map((side) => (
                <div key={side} className="space-y-2">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-stone-500">
                    {side} rail
                  </p>
                  {railSpots(side).map((id) => {
                    // Prefer the active sponsor; fall back to an expired one
                    // still holding the doc so it can be cleaned up here.
                    const spotSponsors = (sponsors ?? []).filter((s) => s.spot === id);
                    const sponsor =
                      spotSponsors.find((s) => sponsorIsActive(s)) ?? spotSponsors[0];
                    const expired = sponsor ? !sponsorIsActive(sponsor) : false;
                    return (
                      <div
                        key={id}
                        className={`rounded-xl border-2 px-3 py-2.5 text-sm ${
                          sponsor
                            ? "border-stone-300 bg-white dark:border-stone-700 dark:bg-stone-900"
                            : "border-dashed border-stone-200 text-stone-400 dark:border-stone-800"
                        }`}
                      >
                        {sponsor ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="shrink-0 font-mono text-xs text-stone-400">
                                #{id.split("-")[1]}
                              </span>
                              <ToolIcon name={sponsor.name} url={sponsor.url} size={20} />
                              <a
                                href={sponsor.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={sponsor.tagline}
                                className="min-w-0 flex-1 truncate font-medium hover:underline"
                              >
                                {sponsor.name}
                              </a>
                              {sponsor.endsAt &&
                                (expired ? (
                                  <span
                                    className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 font-mono text-xs text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                    title={`Off the rails since ${new Date(sponsor.endsAt).toLocaleDateString()}. Remove to free the doc, or re-activate the purchase to renew.`}
                                  >
                                    expired
                                  </span>
                                ) : (
                                  <span
                                    className="shrink-0 font-mono text-xs text-stone-500"
                                    title={new Date(sponsor.endsAt).toLocaleString()}
                                  >
                                    until{" "}
                                    {new Date(sponsor.endsAt).toLocaleDateString("en-GB", {
                                      day: "numeric",
                                      month: "short",
                                    })}
                                  </span>
                                ))}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className="rounded-full bg-emerald-100 px-2 py-0.5 font-mono text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                title="Outbound clicks on this card"
                              >
                                {(
                                  clickCounts[`sponsor-${sponsor.sessionId}`] ?? 0
                                ).toLocaleString()}{" "}
                                clicks
                              </span>
                              <span className="font-mono text-xs text-stone-500">
                                ${sponsor.amountUsd}
                              </span>
                              <span className="flex-1" />
                              <select
                                value={sponsor.renewal ?? ""}
                                disabled={busyId !== null}
                                onChange={(e) =>
                                  void updateRenewal(
                                    sponsor,
                                    e.target.value ? (e.target.value as RenewalStatus) : null,
                                  )
                                }
                                title="What happens when their 30 days end? Shown on /sponsor."
                                className="rounded-lg border-2 border-stone-300 bg-white px-1.5 py-1 text-xs disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900"
                              >
                                <option value="">status…</option>
                                {(Object.keys(RENEWAL_LABELS) as RenewalStatus[]).map((status) => (
                                  <option key={status} value={status}>
                                    {RENEWAL_LABELS[status]}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                disabled={busyId !== null}
                                onClick={() => void unpublishSponsor(sponsor)}
                                className="rounded-lg border-2 border-stone-300 px-2 py-1 text-xs font-semibold transition-colors hover:border-rose-500 hover:text-rose-600 disabled:opacity-50 dark:border-stone-700"
                              >
                                {busyId === sponsor.sessionId ? "…" : "Remove"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 py-0.5">
                            <span className="font-mono text-xs">#{id.split("-")[1]}</span>
                            <span>empty</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-display text-lg font-bold">Paid on Stripe</h2>
            {purchasesError && (
              <p className="rounded-xl border-2 border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                {purchasesError}
              </p>
            )}
            {!purchasesError && purchases && purchases.length === 0 && (
              <p className="py-6 text-center text-stone-500">No sponsor payments yet.</p>
            )}
            {!purchasesError && purchases && purchases.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={HEAD_ROW_CLASS}>
                      <th className={TH_CLASS}>Date</th>
                      <th className={TH_CLASS}>Product</th>
                      <th className={TH_CLASS}>Spot</th>
                      <th className={TH_CLASS}>Email</th>
                      <th className={TH_CLASS}>Paid</th>
                      <th className="py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((p) => {
                      const live = (sponsors ?? []).some(
                        (s) => s.sessionId === p.sessionId && sponsorIsActive(s),
                      );
                      // Only an active sponsor blocks the spot: an expired
                      // one is overwritten by a renewal, not a squatter.
                      const spotOccupied = (sponsors ?? []).some(
                        (s) =>
                          s.spot === p.spot && s.sessionId !== p.sessionId && sponsorIsActive(s),
                      );
                      return (
                        <tr key={p.sessionId} className={ROW_CLASS}>
                          <td className="py-2.5 pr-4 font-mono text-xs">
                            {new Date(p.createdAt * 1000).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className="flex items-center gap-2 font-medium">
                              <ToolIcon name={p.name} url={p.url} size={20} />
                              {p.name}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 font-mono text-xs">{p.spot}</td>
                          <td className="py-2.5 pr-4 font-mono text-xs">{p.email ?? "n/a"}</td>
                          <td className="py-2.5 pr-4 font-mono">${p.amountUsd}</td>
                          <td className="py-2.5">
                            {live ? (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-mono text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                ✓ live
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={busyId !== null || spotOccupied}
                                title={
                                  spotOccupied
                                    ? "Spot occupied. Remove the current sponsor first."
                                    : `Publish to ${spotLabel(p.spot).toLowerCase()}`
                                }
                                onClick={() => void activatePurchase(p)}
                                className="rounded-lg border-2 border-stone-300 px-2.5 py-0.5 text-xs font-semibold transition-colors hover:border-emerald-500 disabled:opacity-50 dark:border-stone-700"
                              >
                                {busyId === p.sessionId ? "…" : "▶ Activate"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {tab === "categories" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-stone-500">
              A category is a set of prompts: the noun slots into the questions, the leader into
              &ldquo;alternatives to X&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowAddCategory((v) => !v);
                setAddCategoryError(null);
              }}
              className="rounded-xl border-2 border-stone-900 bg-white px-3 py-1.5 text-sm font-semibold shadow-[2px_2px_0_0_var(--ink)] transition-transform hover:-translate-y-0.5 dark:border-stone-600 dark:bg-stone-900"
            >
              {showAddCategory ? "✕ Close" : "＋ Add category"}
            </button>
          </div>

          {showAddCategory && (
            <div className="space-y-3 rounded-2xl border-2 border-stone-900 bg-white p-4 shadow-[4px_4px_0_0_var(--ink)] dark:border-stone-600 dark:bg-stone-900">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory((prev) => ({
                      ...prev,
                      name: e.target.value,
                      ...(slugEdited ? {} : { slug: slugify(e.target.value) }),
                    }))
                  }
                  placeholder="Name, plural (e.g. Form builders)"
                  aria-label="Category name"
                  className={INPUT_CLASS}
                />
                <input
                  type="text"
                  value={newCategory.slug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    setNewCategory((prev) => ({ ...prev, slug: e.target.value }));
                  }}
                  placeholder="slug (stable forever, used in the URL)"
                  aria-label="Category slug"
                  className={`${INPUT_CLASS} font-mono`}
                />
                <input
                  type="text"
                  value={newCategory.emoji}
                  onChange={(e) => setNewCategory((prev) => ({ ...prev, emoji: e.target.value }))}
                  placeholder="Emoji (e.g. 📝)"
                  aria-label="Category emoji"
                  className={INPUT_CLASS}
                />
                <input
                  type="text"
                  value={newCategory.noun}
                  onChange={(e) => setNewCategory((prev) => ({ ...prev, noun: e.target.value }))}
                  placeholder="Noun, singular (e.g. form builder)"
                  aria-label="Category noun"
                  className={INPUT_CLASS}
                />
              </div>
              <select
                value={newCategory.leader}
                onChange={(e) => setNewCategory((prev) => ({ ...prev, leader: e.target.value }))}
                aria-label="Leader tool"
                className={INPUT_CLASS}
              >
                <option value="">Leader: the incumbent everyone knows…</option>
                {(tools ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.id})
                  </option>
                ))}
              </select>
              <p className="rounded-xl bg-stone-50 px-3 py-2 font-mono text-xs text-stone-500 dark:bg-stone-950">
                &ldquo;best {newCategory.noun || "…"} for a solo founder&rdquo; ·{" "}
                &ldquo;alternatives to{" "}
                {(tools ?? []).find((t) => t.id === newCategory.leader)?.name ?? "…"}&rdquo;
              </p>
              {addCategoryError && (
                <p className="text-sm text-rose-600 dark:text-rose-400">{addCategoryError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={addingCategory}
                  onClick={() => void addCategory()}
                  className="rounded-xl border-2 border-stone-900 bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white shadow-[2px_2px_0_0_var(--ink)] transition-transform hover:-translate-y-0.5 disabled:opacity-60 dark:border-stone-600"
                >
                  {addingCategory ? "Adding…" : "Save category"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCategory(false);
                    setNewCategory({ ...EMPTY_NEW_CATEGORY });
                    setSlugEdited(false);
                    setAddCategoryError(null);
                  }}
                  className="rounded-xl border-2 border-stone-300 px-4 py-1.5 text-sm font-semibold text-stone-600 transition-colors hover:border-stone-900 dark:border-stone-700 dark:text-stone-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
          {categories && categories.length === 0 ? (
            <p className="py-8 text-center text-stone-500">
              Nothing in Firestore yet. Hit &ldquo;Sync catalog from code&rdquo; above.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className={HEAD_ROW_CLASS}>
                  <th className={TH_CLASS}>Category</th>
                  <th className={TH_CLASS}>Slug</th>
                  <th className={TH_CLASS}>Leader</th>
                  <th className={TH_CLASS}>Tools</th>
                  <th className={TH_CLASS}>Top tool (live)</th>
                  <th className="py-2 font-medium">Run</th>
                </tr>
              </thead>
              <tbody>
                {(categories ?? []).map((c) => (
                  <tr key={c.slug} className={ROW_CLASS}>
                    <td className="py-2.5 pr-4 font-medium" title={c.noun}>
                      {c.emoji} {c.name}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs">{c.slug}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs">{c.leader}</td>
                    <td className="py-2.5 pr-4 font-mono">{toolCountByCategory.get(c.slug) ?? 0}</td>
                    <td className="py-2.5 pr-4">
                      {c.scores?.[0] ? (
                        <span>
                          {c.scores[0].name}{" "}
                          <span className="font-mono text-emerald-600 dark:text-emerald-400">
                            {c.scores[0].visibility}
                          </span>
                        </span>
                      ) : (
                        <span className="text-stone-400">n/a</span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <button
                        type="button"
                        disabled={syncing || running !== null || selectedRunners.length === 0}
                        onClick={() => void runCategories([c], c.slug)}
                        title={`Run snapshot for ${c.name}`}
                        className="rounded-lg border-2 border-stone-300 px-2 py-0.5 text-xs font-semibold transition-colors hover:border-emerald-500 disabled:opacity-50 dark:border-stone-700"
                      >
                        {running === c.slug ? "…" : "▶"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          </div>
        </section>
      )}

      {tab === "tools" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-stone-500">
              Adding here is instant; adding to src/data/categories.ts as well makes it
              permanent and keeps the open dataset in sync.
            </p>
            <button
              type="button"
              onClick={() => {
                if (showAddTool) {
                  setNewTool({ ...EMPTY_NEW_TOOL });
                  setEditingToolId(null);
                  setIdEdited(false);
                }
                setShowAddTool((v) => !v);
                setAddToolError(null);
              }}
              className="rounded-xl border-2 border-stone-900 bg-white px-3 py-1.5 text-sm font-semibold shadow-[2px_2px_0_0_var(--ink)] transition-transform hover:-translate-y-0.5 dark:border-stone-600 dark:bg-stone-900"
            >
              {showAddTool ? "✕ Close" : "＋ Add tool"}
            </button>
          </div>

          {showAddTool && (
            <div className="space-y-3 rounded-2xl border-2 border-stone-900 bg-white p-4 shadow-[4px_4px_0_0_var(--ink)] dark:border-stone-600 dark:bg-stone-900">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={newTool.name}
                  onChange={(e) =>
                    setNewTool((prev) => ({
                      ...prev,
                      name: e.target.value,
                      ...(idEdited ? {} : { id: slugify(e.target.value) }),
                    }))
                  }
                  placeholder="Name (e.g. Buffer)"
                  aria-label="Tool name"
                  className={INPUT_CLASS}
                />
                <input
                  type="text"
                  value={newTool.id}
                  disabled={editingToolId !== null}
                  onChange={(e) => {
                    setIdEdited(true);
                    setNewTool((prev) => ({ ...prev, id: e.target.value }));
                  }}
                  placeholder="id-slug (stable forever, used in the URL)"
                  aria-label="Tool id"
                  title={editingToolId ? "Ids are stable forever; history keys on them." : undefined}
                  className={`${INPUT_CLASS} font-mono disabled:opacity-60`}
                />
                <input
                  type="text"
                  value={newTool.url}
                  onChange={(e) => setNewTool((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder="website.com"
                  aria-label="Website URL"
                  className={INPUT_CLASS}
                />
                <input
                  type="text"
                  value={newTool.price}
                  onChange={(e) => setNewTool((prev) => ({ ...prev, price: e.target.value }))}
                  placeholder='Price (e.g. "Free + $9/mo")'
                  aria-label="Price"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <input
                  type="text"
                  value={newTool.aliases}
                  onChange={(e) => setNewTool((prev) => ({ ...prev, aliases: e.target.value }))}
                  placeholder="Aliases, comma separated (e.g. Buffer, Buffer app)"
                  aria-label="Aliases"
                  className={INPUT_CLASS}
                />
                <p className="mt-1 text-xs text-stone-500">
                  The complete list of strings that count as a mention: the name is NOT matched
                  automatically, so include it. End an alias with ! to match case-sensitively
                  (product names that are common words, like Later!).
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(categories ?? []).map((c) => {
                  const active = newTool.categorySlugs.includes(c.slug);
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() =>
                        setNewTool((prev) => ({
                          ...prev,
                          categorySlugs: active
                            ? prev.categorySlugs.filter((s) => s !== c.slug)
                            : [...prev.categorySlugs, c.slug],
                        }))
                      }
                      className={`rounded-full border-2 px-3 py-1 text-xs transition-all ${
                        active
                          ? "border-stone-900 bg-emerald-100 font-semibold dark:border-emerald-500 dark:bg-emerald-950"
                          : "border-stone-300 bg-white text-stone-600 hover:border-stone-900 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-400 dark:hover:border-stone-400"
                      }`}
                    >
                      {active ? "✓ " : ""}
                      {c.emoji} {c.name}
                    </button>
                  );
                })}
              </div>
              {addToolError && (
                <p className="text-sm text-rose-600 dark:text-rose-400">{addToolError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={addingTool}
                  onClick={() => void addTool()}
                  className="rounded-xl border-2 border-stone-900 bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white shadow-[2px_2px_0_0_var(--ink)] transition-transform hover:-translate-y-0.5 disabled:opacity-60 dark:border-stone-600"
                >
                  {addingTool ? "Saving…" : editingToolId ? "Save changes" : "Save tool"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTool(false);
                    setNewTool({ ...EMPTY_NEW_TOOL });
                    setIdEdited(false);
                    setEditingToolId(null);
                    setAddToolError(null);
                  }}
                  className="rounded-xl border-2 border-stone-300 px-4 py-1.5 text-sm font-semibold text-stone-600 transition-colors hover:border-stone-900 dark:border-stone-700 dark:text-stone-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
          {tools && tools.length === 0 ? (
            <p className="py-8 text-center text-stone-500">
              Nothing in Firestore yet. Hit &ldquo;Sync catalog from code&rdquo; above.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className={HEAD_ROW_CLASS}>
                  <th className={TH_CLASS}>Tool</th>
                  <th className={TH_CLASS}>Id</th>
                  <th className={TH_CLASS}>Categories</th>
                  <th className={TH_CLASS}>Price</th>
                  <th className={TH_CLASS}>Clicks</th>
                  <th className={TH_CLASS}>Aliases</th>
                  <th className={TH_CLASS}>Live rank</th>
                  <th className="py-2 font-medium">Run</th>
                </tr>
              </thead>
              <tbody>
                {(tools ?? []).map((t) => (
                  <tr key={t.id} className={ROW_CLASS}>
                    <td className="py-2.5 pr-4">
                      <span className="flex items-center gap-2 font-medium">
                        <ToolIcon name={t.name} url={t.url} size={20} />
                        {t.name}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs">{t.id}</td>
                    <td className="py-2.5 pr-4">
                      {t.categorySlugs.map((slug) => (
                        <span key={slug} className="mr-1" title={categoryBySlug.get(slug)?.name ?? slug}>
                          {categoryBySlug.get(slug)?.emoji ?? slug}
                        </span>
                      ))}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs">{t.price}</td>
                    <td
                      className="py-2.5 pr-4 font-mono text-xs"
                      title="Outbound clicks from this tool's page"
                    >
                      {(clickCounts[`tool-${t.id}`] ?? 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs" title={t.aliases.map((a) => a.text).join(", ")}>
                      {t.aliases.length}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs">
                      {t.scores
                        ? Object.entries(t.scores)
                            .map(
                              ([slug, s]) =>
                                `${categoryBySlug.get(slug)?.emoji ?? slug} #${s.rank} (${s.visibility})`,
                            )
                            .join(" · ")
                        : "n/a"}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={syncing || running !== null || selectedRunners.length === 0}
                          onClick={() =>
                            void runCategories(
                              t.categorySlugs
                                .map((slug) => categoryBySlug.get(slug))
                                .filter((c): c is CategoryDoc => Boolean(c)),
                              t.id,
                            )
                          }
                          title={`Run this tool's ${t.categorySlugs.length > 1 ? "categories" : "category"}`}
                          className="rounded-lg border-2 border-stone-300 px-2 py-0.5 text-xs font-semibold transition-colors hover:border-emerald-500 disabled:opacity-50 dark:border-stone-700"
                        >
                          {running === t.id ? "…" : "▶"}
                        </button>
                        <button
                          type="button"
                          disabled={syncing || running !== null}
                          onClick={() => startEditTool(t)}
                          title={`Edit ${t.name} (aliases, price, categories)`}
                          className="rounded-lg border-2 border-stone-300 px-2 py-0.5 text-xs font-semibold transition-colors hover:border-emerald-500 disabled:opacity-50 dark:border-stone-700"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          disabled={syncing || running !== null || busyId !== null}
                          onClick={() => void deleteTool(t)}
                          title={`Delete ${t.name} from Firestore`}
                          className="rounded-lg border-2 border-stone-300 px-2 py-0.5 text-xs font-semibold transition-colors hover:border-rose-500 hover:text-rose-600 disabled:opacity-50 dark:border-stone-700"
                        >
                          {busyId === t.id ? "…" : "🗑"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          </div>
        </section>
      )}

      {tab === "settings" && (
        <section className="max-w-md">
          <div className="rounded-2xl border-2 border-stone-900 bg-white p-5 shadow-[4px_4px_0_0_var(--ink)] dark:border-stone-600 dark:bg-stone-900">
            <h2 className="font-display text-lg font-bold">Sponsor spot price</h2>
            <p className="mt-1 text-sm text-stone-500">
              Charged to the next sponsor at checkout. Current:{" "}
              {priceUsd ? (
                <span className="font-mono font-semibold text-stone-900 dark:text-stone-100">
                  ${priceUsd}
                </span>
              ) : (
                <span className="text-rose-500">not set, checkout is disabled</span>
              )}
              . Sold spots keep the price they paid.
            </p>
            <div className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                  $
                </span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="99"
                  aria-label="Price in USD for the next sponsor"
                  className="w-full rounded-xl border-2 border-stone-900 bg-white py-2 pl-7 pr-3 font-mono outline-none transition-all placeholder:text-stone-400 focus:-translate-y-0.5 focus:shadow-[3px_3px_0_0_var(--ink)] dark:border-stone-600 dark:bg-stone-950"
                />
              </div>
              <button
                type="button"
                disabled={savingPrice}
                onClick={() => void savePrice()}
                className="rounded-xl border-2 border-stone-900 bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-[3px_3px_0_0_var(--ink)] transition-transform hover:-translate-y-0.5 disabled:opacity-60 dark:border-stone-600"
              >
                {savingPrice ? "Saving…" : "Save"}
              </button>
            </div>
            {priceMessage && <p className="mt-3 text-sm">{priceMessage}</p>}
            <p className="mt-4 text-xs text-stone-500">
              /sponsor shows the new price within 5 minutes; the checkout itself always charges
              the value saved here, whatever the page displayed.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
