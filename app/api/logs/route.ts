import { NextResponse } from "next/server";
import { LOGS_DIR } from "@/lib/vault";
import { listVaultFiles } from "@/lib/list-files";

export async function GET() {
  return NextResponse.json(await listVaultFiles(LOGS_DIR));
}
