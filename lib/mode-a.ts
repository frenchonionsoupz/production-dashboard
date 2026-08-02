import fs from "node:fs/promises";
import path from "node:path";
import { INBOX_RAW_DIR, INBOX_DIR, LOGS_DIR } from "./vault";
import { readVaultDir, writeVaultFile } from "./frontmatter";
import { appendLogEntry, readRecentEntries } from "./log-overview";
import { runProductionManager } from "./claude-headless";
import { search } from "./index-store";
import { slugify } from "./slugify";

/** Best-effort: the index may not be built yet (first run, or the local
 * embedding model hasn't downloaded), so a failure here just means Claude
 * falls back to its own Glob/Grep exploration for linking. */
async function getCandidateLinksText(transcript: string): Promise<string> {
  try {
    const results = await search(transcript, 5);
    if (results.length === 0) return "";
    return results
      .map((r) => `- ${r.path} ("${r.title}", tags: ${r.tags.join(", ") || "none"})\n  "${r.text.slice(0, 200)}..."`)
      .join("\n");
  } catch {
    return "";
  }
}

export type ProcessSummary = {
  processed: { rawFile: string; filedTo: string; tags: string[] }[];
  skipped: string[];
  errors: { rawFile: string; error: string }[];
};

async function listRawTranscripts(): Promise<string[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(INBOX_RAW_DIR);
  } catch {
    return [];
  }
  return entries.filter((name) => !name.startsWith(".")).sort();
}

async function alreadyProcessedFilenames(): Promise<Set<string>> {
  const [inbox, logs] = await Promise.all([
    readVaultDir(INBOX_DIR),
    readVaultDir(LOGS_DIR),
  ]);
  const set = new Set<string>();
  for (const file of [...inbox, ...logs]) {
    if (file.data.source_file) set.add(file.data.source_file);
  }
  return set;
}

/** Scans Inbox-Raw/ for transcripts not yet represented in Inbox/ or Logs/
 * (tracked via the source_file frontmatter field) and runs each through the
 * Production Manager. This is the whole of Mode A — triggered by dashboard
 * load or the "Process Now" button, never an always-on process. */
export async function processInboxRaw(): Promise<ProcessSummary> {
  const [rawFiles, processed] = await Promise.all([
    listRawTranscripts(),
    alreadyProcessedFilenames(),
  ]);

  const summary: ProcessSummary = { processed: [], skipped: [], errors: [] };

  for (const rawFile of rawFiles) {
    if (processed.has(rawFile)) {
      summary.skipped.push(rawFile);
      continue;
    }

    try {
      const transcript = await fs.readFile(path.join(INBOX_RAW_DIR, rawFile), "utf8");
      const [recentLog, candidateLinks] = await Promise.all([
        readRecentEntries(),
        getCandidateLinksText(transcript),
      ]);
      const result = await runProductionManager(rawFile, transcript, recentLog, candidateLinks);

      const date = new Date().toISOString().slice(0, 10);
      const filename = `${date}-${slugify(result.title)}.md`;
      const filedTo = path.join(INBOX_DIR, filename);

      await writeVaultFile(
        filedTo,
        {
          title: result.title,
          tags: result.tags,
          linked_to: result.linked_to,
          date,
          source: "voice-memo",
          source_file: rawFile,
        },
        result.cleaned_transcript
      );

      await appendLogEntry({
        sourceFile: rawFile,
        filedTo: `Inbox/${filename}`,
        tags: result.tags,
        linkedTo: result.linked_to,
        notes: result.notes,
      });

      summary.processed.push({ rawFile, filedTo: `Inbox/${filename}`, tags: result.tags });
    } catch (err) {
      summary.errors.push({ rawFile, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return summary;
}
