import fs from "node:fs/promises";
import { LOG_OVERVIEW_PATH } from "./vault";

export async function readLogOverview(): Promise<string> {
  try {
    return await fs.readFile(LOG_OVERVIEW_PATH, "utf8");
  } catch {
    return "";
  }
}

/** Last N entries (entries are separated by "## " headers), for feeding as
 * correction context — recent enough to matter, short enough to stay cheap. */
export async function readRecentEntries(n = 15): Promise<string> {
  const full = await readLogOverview().then((text) => text.replace(/<!--[\s\S]*?-->/g, ""));
  const entries = full.split(/\n(?=## )/g).filter((e) => e.trim().startsWith("## "));
  return entries.slice(-n).join("\n\n").trim();
}

export async function appendLogEntry(entry: {
  sourceFile: string;
  filedTo: string;
  tags: string[];
  linkedTo: string[];
  notes: string;
}): Promise<void> {
  const now = new Date();
  const stamp = now.toISOString().slice(0, 16).replace("T", " ");
  const block = [
    `## ${stamp} — ${entry.sourceFile}`,
    `- Filed to: ${entry.filedTo}`,
    `- Tags: ${entry.tags.length ? entry.tags.join(", ") : "none"}`,
    `- Linked to: ${entry.linkedTo.length ? entry.linkedTo.join(", ") : "none"}`,
    `- Notes: ${entry.notes}`,
    "",
  ].join("\n");

  const existing = await readLogOverview();
  await fs.writeFile(LOG_OVERVIEW_PATH, existing.trimEnd() + "\n\n" + block, "utf8");
}
