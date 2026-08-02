import { NextResponse } from "next/server";
import { WIPS_DIR } from "@/lib/vault";
import { listVaultFiles } from "@/lib/list-files";

export async function GET() {
  return NextResponse.json(await listVaultFiles(WIPS_DIR));
}
