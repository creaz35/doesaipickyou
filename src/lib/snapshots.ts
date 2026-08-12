import fs from "node:fs";
import path from "node:path";
import type { Snapshot } from "./types";

const SNAPSHOT_DIR = path.join(process.cwd(), "data", "snapshots");

/** Snapshot ids sorted oldest → newest ("2026-08" sorts lexicographically). */
export function listSnapshotIds(): string[] {
  if (!fs.existsSync(SNAPSHOT_DIR)) return [];
  return fs
    .readdirSync(SNAPSHOT_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .sort();
}

export function loadSnapshot(id: string): Snapshot {
  const raw = fs.readFileSync(path.join(SNAPSHOT_DIR, `${id}.json`), "utf8");
  return JSON.parse(raw) as Snapshot;
}

export function loadLatestSnapshot(): Snapshot | null {
  const ids = listSnapshotIds();
  return ids.length ? loadSnapshot(ids[ids.length - 1]) : null;
}
