import fs from "node:fs/promises";
import Anthropic from "@anthropic-ai/sdk";
import { search } from "@/lib/index-store";
import { readRecentEntries } from "@/lib/log-overview";
import { CLAUDE_MD_PATH } from "@/lib/vault";

const anthropic = new Anthropic();

type ChatMessage = { role: "user" | "assistant"; content: string };

function buildCandidatesText(candidates: Awaited<ReturnType<typeof search>>): string {
  if (candidates.length === 0) {
    return "(no close matches — index may not be built yet, or nothing relevant found)";
  }
  return candidates
    .map((c) => `- ${c.path} ("${c.title}", tags: ${c.tags.join(", ") || "none"})\n  "${c.text}"`)
    .join("\n\n");
}

export async function POST(request: Request) {
  const { messages } = (await request.json()) as { messages: ChatMessage[] };
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  const [candidates, recentLog, claudeMd] = await Promise.all([
    search(lastUserMessage, 8).catch(() => []),
    readRecentEntries(),
    fs.readFile(CLAUDE_MD_PATH, "utf8").catch(() => ""),
  ]);

  const system = `${claudeMd}

---

You are in Mode B: the conversational Production Manager, chatting directly
with the writer in the dashboard. Follow the job description above. When
asked whether there are related logs, quote them verbatim where useful
rather than paraphrasing. When the writer pastes in a WIP, ask clarifying
questions that surface gaps — missing stories, missing emotional beats — so
they can go answer them via a new voice memo.

Relevant vault content for this message (from semantic search over Logs/,
WIPs/, and Finalized/):
---
${buildCandidatesText(candidates)}
---

Recent log-overview.md entries (for context on prior corrections):
---
${recentLog || "(no entries yet)"}
---`;

  const stream = anthropic.messages.stream({
    model: "claude-opus-5",
    max_tokens: 4096,
    system,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      // The SDK stream can emit "error" and then still emit "end" (or vice
      // versa) — guard so we never call close()/error() on an already
      // terminated controller.
      let settled = false;
      stream.on("text", (delta) => {
        if (!settled) controller.enqueue(encoder.encode(delta));
      });
      stream.on("end", () => {
        if (!settled) {
          settled = true;
          controller.close();
        }
      });
      stream.on("error", (err) => {
        if (!settled) {
          settled = true;
          controller.error(err);
        }
      });
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
