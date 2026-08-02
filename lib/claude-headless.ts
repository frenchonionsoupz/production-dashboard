import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { VAULT_PATH } from "./vault";

const execFileAsync = promisify(execFile);

export type ProcessorResult = {
  title: string;
  tags: string[];
  linked_to: string[];
  cleaned_transcript: string;
  notes: string;
};

const RESULT_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    linked_to: {
      type: "array",
      items: { type: "string" },
      description:
        "Vault-relative paths (e.g. WIPs/some-piece.md) of related pieces, or empty if none.",
    },
    cleaned_transcript: {
      type: "string",
      description:
        "The transcript with filler/false starts lightly cleaned up, voice preserved.",
    },
    notes: {
      type: "string",
      description: "One-line explanation of the tags and links chosen.",
    },
  },
  required: ["title", "tags", "linked_to", "cleaned_transcript", "notes"],
  additionalProperties: false,
};

function buildPrompt(filename: string, transcript: string, recentLog: string): string {
  return `A new voice-memo transcript landed in Inbox-Raw/. Process it per your job
description in CLAUDE.md (tagging rules, linking, and how to use
log-overview.md corrections).

Source file: Inbox-Raw/${filename}

Recent log-overview.md entries (read for corrections/lessons before you tag):
---
${recentLog || "(no entries yet)"}
---

Transcript content:
---
${transcript}
---

Before deciding tags and linked_to, use your Read/Glob/Grep tools to check
existing frontmatter in WIPs/, Logs/, and Finalized/ for reusable tags and
related pieces. Respond with ONLY the JSON object described by the schema —
no extra commentary.`;
}

/** Runs one Inbox-Raw transcript through the Production Manager (Mode A),
 * headless. Claude only gets read-only tools — this process performs the
 * actual file writes deterministically once Claude returns its judgment. */
export async function runProductionManager(
  filename: string,
  transcript: string,
  recentLog: string
): Promise<ProcessorResult> {
  const prompt = buildPrompt(filename, transcript, recentLog);

  const { stdout } = await execFileAsync(
    "claude",
    [
      "-p",
      prompt,
      "--output-format",
      "json",
      "--json-schema",
      JSON.stringify(RESULT_SCHEMA),
      "--allowedTools",
      "Read,Glob,Grep",
      "--add-dir",
      VAULT_PATH,
    ],
    {
      cwd: VAULT_PATH,
      timeout: 5 * 60 * 1000,
      maxBuffer: 20 * 1024 * 1024,
    }
  );

  const envelope = JSON.parse(stdout);
  if (envelope.is_error) {
    throw new Error(`claude headless run failed: ${envelope.result ?? "unknown error"}`);
  }
  return JSON.parse(envelope.result) as ProcessorResult;
}
