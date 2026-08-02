import fs from "node:fs/promises";
import path from "node:path";
import * as lancedb from "@lancedb/lancedb";
import { VAULT_PATH, LOGS_DIR, WIPS_DIR, FINALIZED_DIR, INDEX_DIR } from "./vault";
import { readVaultFile, listMarkdownFiles } from "./frontmatter";
import { chunkText } from "./chunk";
import { embed } from "./embeddings";

const LANCE_DB_DIR = path.join(INDEX_DIR, "lancedb");
const MANIFEST_PATH = path.join(INDEX_DIR, "manifest.json");
const TABLE_NAME = "content";

type Manifest = Record<string, { mtimeMs: number }>;

export type SearchResult = {
  path: string;
  title: string;
  tags: string[];
  text: string;
  distance: number;
};

export type ReindexSummary = { updated: number; removed: number; total: number };

function toRelPath(absPath: string): string {
  return path.relative(VAULT_PATH, absPath).split(path.sep).join("/");
}

async function loadManifest(): Promise<Manifest> {
  try {
    return JSON.parse(await fs.readFile(MANIFEST_PATH, "utf8"));
  } catch {
    return {};
  }
}

async function saveManifest(manifest: Manifest): Promise<void> {
  await fs.mkdir(INDEX_DIR, { recursive: true });
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");
}

async function gatherContentFiles(): Promise<Map<string, { absPath: string; mtimeMs: number }>> {
  const dirs = [LOGS_DIR, WIPS_DIR, FINALIZED_DIR];
  const files = new Map<string, { absPath: string; mtimeMs: number }>();
  for (const dir of dirs) {
    for (const absPath of await listMarkdownFiles(dir)) {
      const stat = await fs.stat(absPath);
      files.set(toRelPath(absPath), { absPath, mtimeMs: stat.mtimeMs });
    }
  }
  return files;
}

function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

/** Incremental reindex over Logs/, WIPs/, and Finalized/: only files that
 * are new, changed (by mtime), or deleted since the last run are touched.
 * Content is chunked by paragraph and embedded locally (no API calls). */
export async function reindex(): Promise<ReindexSummary> {
  await fs.mkdir(INDEX_DIR, { recursive: true });
  const manifest = await loadManifest();
  const current = await gatherContentFiles();

  const toRemove = Object.keys(manifest).filter((p) => !current.has(p));
  const toUpdate = [...current.entries()]
    .filter(([p, { mtimeMs }]) => manifest[p]?.mtimeMs !== mtimeMs)
    .map(([p]) => p);

  if (toRemove.length === 0 && toUpdate.length === 0) {
    return { updated: 0, removed: 0, total: current.size };
  }

  const db = await lancedb.connect(LANCE_DB_DIR);
  const tableExists = (await db.tableNames()).includes(TABLE_NAME);
  const table = tableExists ? await db.openTable(TABLE_NAME) : null;

  const staleKeys = [...new Set([...toRemove, ...toUpdate])];
  if (table && staleKeys.length > 0) {
    const predicate = staleKeys.map((p) => `'${escapeSqlString(p)}'`).join(", ");
    await table.delete(`path IN (${predicate})`);
  }

  const newRows: Record<string, unknown>[] = [];
  for (const relPath of toUpdate) {
    const { absPath } = current.get(relPath)!;
    const file = await readVaultFile(absPath);
    const title = file.data.title ?? relPath;
    const tags = file.data.tags ?? [];
    const chunks = chunkText(file.content);

    for (let i = 0; i < chunks.length; i++) {
      const embeddingInput = `${title}\ntags: ${tags.join(", ")}\n\n${chunks[i]}`;
      const vector = await embed(embeddingInput);
      newRows.push({
        id: `${relPath}#${i}`,
        path: relPath,
        title,
        tags: tags.join(","),
        chunk_index: i,
        text: chunks[i],
        vector,
      });
    }
  }

  if (newRows.length > 0) {
    if (table) {
      await table.add(newRows);
    } else {
      await db.createTable(TABLE_NAME, newRows);
    }
  }

  for (const p of toRemove) delete manifest[p];
  for (const p of toUpdate) manifest[p] = { mtimeMs: current.get(p)!.mtimeMs };
  await saveManifest(manifest);

  return { updated: toUpdate.length, removed: toRemove.length, total: current.size };
}

/** Semantic search over the indexed vault content. */
export async function search(query: string, k = 5): Promise<SearchResult[]> {
  const db = await lancedb.connect(LANCE_DB_DIR);
  if (!(await db.tableNames()).includes(TABLE_NAME)) return [];

  const table = await db.openTable(TABLE_NAME);
  const vector = await embed(query);
  const rows = await table.search(vector).limit(k).toArray();

  return rows.map((row) => ({
    path: row.path as string,
    title: row.title as string,
    tags: (row.tags as string) ? (row.tags as string).split(",") : [],
    text: row.text as string,
    distance: row._distance as number,
  }));
}
