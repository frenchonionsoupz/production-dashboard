import path from "node:path";

export const VAULT_PATH = path.resolve(
  process.cwd(),
  process.env.VAULT_PATH ?? "./vault"
);

// Inbox-Raw is the only folder that needs to live somewhere synced (e.g.
// iCloud Drive), since it's the drop-off point from a phone. Everything
// else stays under VAULT_PATH. Defaults to VAULT_PATH/Inbox-Raw if unset.
export const INBOX_RAW_DIR = process.env.INBOX_RAW_PATH
  ? path.resolve(process.cwd(), process.env.INBOX_RAW_PATH)
  : path.join(VAULT_PATH, "Inbox-Raw");
export const INBOX_DIR = path.join(VAULT_PATH, "Inbox");
export const LOGS_DIR = path.join(VAULT_PATH, "Logs");
export const WIPS_DIR = path.join(VAULT_PATH, "WIPs");
export const FINALIZED_DIR = path.join(VAULT_PATH, "Finalized");
export const INDEX_DIR = path.join(VAULT_PATH, ".index");
export const LOG_OVERVIEW_PATH = path.join(VAULT_PATH, "log-overview.md");
export const CLAUDE_MD_PATH = path.join(VAULT_PATH, "CLAUDE.md");
