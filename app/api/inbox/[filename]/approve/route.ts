import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { INBOX_DIR, LOGS_DIR } from "@/lib/vault";
import { reindex } from "@/lib/index-store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  if (!filename.endsWith(".md") || filename.includes("/") || filename.includes("..")) {
    return NextResponse.json({ error: "invalid filename" }, { status: 400 });
  }

  const from = path.join(INBOX_DIR, filename);
  const to = path.join(LOGS_DIR, filename);

  try {
    await fs.access(to);
    return NextResponse.json({ error: "a file with this name already exists in Logs/" }, { status: 409 });
  } catch {
    // doesn't exist yet, good
  }

  await fs.rename(from, to);

  // The move to Logs/ is the operation that matters — don't fail the
  // approve just because reindexing (e.g. the embedding model can't be
  // reached) had trouble.
  let indexError: string | null = null;
  try {
    await reindex();
  } catch (err) {
    indexError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({ ok: true, indexError });
}
