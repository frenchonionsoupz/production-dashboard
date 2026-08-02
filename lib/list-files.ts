import { readVaultDir } from "./frontmatter";

export type VaultFileSummary = {
  filename: string;
  title: string;
  status?: string;
  tags: string[];
  linked_to: string[];
  date: string;
  source: string;
  content: string;
};

export async function listVaultFiles(dir: string): Promise<VaultFileSummary[]> {
  const files = await readVaultDir(dir);
  return files
    .map((f) => ({
      filename: f.filename,
      title: f.data.title ?? f.filename,
      status: f.data.status,
      tags: f.data.tags ?? [],
      linked_to: f.data.linked_to ?? [],
      date: f.data.date ?? "",
      source: f.data.source ?? "",
      content: f.content,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
