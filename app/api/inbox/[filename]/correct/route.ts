import { NextResponse } from "next/server";
import { appendCorrection } from "@/lib/log-overview";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  if (!filename.endsWith(".md") || filename.includes("/") || filename.includes("..")) {
    return NextResponse.json({ error: "invalid filename" }, { status: 400 });
  }

  const { comment } = await request.json();
  if (!comment || typeof comment !== "string") {
    return NextResponse.json({ error: "comment is required" }, { status: 400 });
  }

  const found = await appendCorrection(`Inbox/${filename}`, comment);
  if (!found) {
    return NextResponse.json(
      { error: "no matching log-overview.md entry found for this file" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
