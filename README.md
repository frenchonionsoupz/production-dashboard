# Production Dashboard

Local-first writing production system: a dashboard for WIPs and a searchable
log archive, plus a Production Manager agent that turns voice-memo
transcripts into tagged, linked logs.

## Setup

```bash
npm install
cp .env.example .env.local   # set VAULT_PATH (point at your real vault) and ANTHROPIC_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Vault

The `vault/` folder is the database — plain markdown + YAML frontmatter, no
DB. `VAULT_PATH` (see `.env.local`) points the app at it; defaults to the
`vault/` folder in this repo, and stays entirely local — it's never synced
anywhere. See `vault/CLAUDE.md` for the Production Manager's job description
and tagging rules, and `vault/log-overview.md` for the running
action/correction feed.

`INBOX_RAW_PATH` is separate and optional: it's the *only* folder that needs
to live somewhere synced across devices (e.g. an iCloud Drive folder), since
it's where transcripts land from a phone. Leave it unset to just use
`VAULT_PATH/Inbox-Raw` locally. Every note in the vault (Inbox, Logs, WIPs)
is still just a plain `.md` file with readable text + YAML frontmatter — open,
copy, or export any of them directly, no export feature needed.

Vault *content* (transcripts, logs, WIPs) is gitignored — only the scaffold
(`CLAUDE.md`, `log-overview.md`, folder structure) is tracked.
