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
`vault/` folder in this repo for local dev. See `vault/CLAUDE.md` for the
Production Manager's job description and tagging rules, and
`vault/log-overview.md` for the running action/correction feed.

Vault *content* (transcripts, logs, WIPs) is gitignored — only the scaffold
(`CLAUDE.md`, `log-overview.md`, folder structure) is tracked.
