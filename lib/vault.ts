import path from "node:path";

export const VAULT_PATH = path.resolve(
  process.cwd(),
  process.env.VAULT_PATH ?? "./vault"
);

export const INBOX_RAW_DIR = path.join(VAULT_PATH, "Inbox-Raw");
export const INBOX_DIR = path.join(VAULT_PATH, "Inbox");
export const LOGS_DIR = path.join(VAULT_PATH, "Logs");
export const WIPS_DIR = path.join(VAULT_PATH, "WIPs");
export const FINALIZED_DIR = path.join(VAULT_PATH, "Finalized");
export const INDEX_DIR = path.join(VAULT_PATH, ".index");
export const LOG_OVERVIEW_PATH = path.join(VAULT_PATH, "log-overview.md");
export const CLAUDE_MD_PATH = path.join(VAULT_PATH, "CLAUDE.md");
