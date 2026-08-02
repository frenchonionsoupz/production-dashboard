import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

export type Frontmatter = {
  title: string;
  status?: "idea" | "outline" | "drafting" | "review" | "final";
  tags: string[];
  linked_to: string[];
  date: string;
  source: "voice-memo" | "manual";
  source_file?: string;
};

export type VaultFile = {
  /** absolute path on disk */
  path: string;
  /** filename only, e.g. "2026-08-02-some-title.md" */
  filename: string;
  data: Frontmatter;
  content: string;
};

export async function listMarkdownFiles(dir: string): Promise<string[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return [];
  }
  return entries
    .filter((name) => name.endsWith(".md"))
    .map((name) => path.join(dir, name));
}

export async function readVaultFile(filePath: string): Promise<VaultFile> {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = matter(raw);
  const data = parsed.data as Frontmatter;

  // YAML parses unquoted "date: 2026-08-02" as a Date, not a string.
  if (data.date && typeof data.date !== "string") {
    data.date = (data.date as unknown as Date).toISOString().slice(0, 10);
  }

  return {
    path: filePath,
    filename: path.basename(filePath),
    data,
    content: parsed.content.trim(),
  };
}

export async function readVaultDir(dir: string): Promise<VaultFile[]> {
  const files = await listMarkdownFiles(dir);
  return Promise.all(files.map(readVaultFile));
}

export async function writeVaultFile(
  filePath: string,
  data: Frontmatter,
  content: string
): Promise<void> {
  const file = matter.stringify(content.trim() + "\n", data);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, file, "utf8");
}
