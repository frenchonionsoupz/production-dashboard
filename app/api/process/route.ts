import { NextResponse } from "next/server";
import { processInboxRaw } from "@/lib/mode-a";
import { reindex } from "@/lib/index-store";

/** Scans Inbox-Raw/ and runs new transcripts through the Production Manager,
 * then incrementally reindexes Logs/WIPs/Finalized. Triggered on dashboard
 * load and by the manual "Process Now" button — never an always-on process. */
export async function POST() {
  const processed = await processInboxRaw();

  let indexed: Awaited<ReturnType<typeof reindex>> | null = null;
  let indexError: string | null = null;
  try {
    indexed = await reindex();
  } catch (err) {
    indexError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({ processed, indexed, indexError });
}
