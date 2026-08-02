"use client";

import { useEffect, useState } from "react";
import { Toolbar } from "./components/Toolbar";
import { WipsView } from "./components/WipsView";
import { InboxView } from "./components/InboxView";
import { LogsView } from "./components/LogsView";

type Tab = "wips" | "inbox" | "logs";

export default function Home() {
  const [tab, setTab] = useState<Tab>("inbox");
  const [refreshKey, setRefreshKey] = useState(0);
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function runProcess() {
    setStatus("running");
    setMessage("");
    try {
      const res = await fetch("/api/process", { method: "POST" });
      const data = await res.json();
      const { processed, indexError } = data;
      const parts = [
        `${processed.processed.length} processed`,
        `${processed.skipped.length} already up to date`,
      ];
      if (processed.errors.length > 0) parts.push(`${processed.errors.length} failed`);
      if (indexError) parts.push("reindex failed (see console)");
      if (indexError) console.error("Reindex error:", indexError);
      setMessage(parts.join(", "));
      setStatus(processed.errors.length > 0 ? "error" : "done");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setRefreshKey((k) => k + 1);
    }
  }

  // Auto-scan Inbox-Raw/ once on dashboard load — never an always-on process.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicks off the on-load processing run
    runProcess();
  }, []);

  const tabs: { key: Tab; label: string }[] = [
    { key: "inbox", label: "Inbox" },
    { key: "wips", label: "WIPs" },
    { key: "logs", label: "Logs" },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-black/10 px-4 py-3 dark:border-white/10">
        <h1 className="text-lg font-semibold">Production Dashboard</h1>
        <nav className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-3 py-1 text-sm ${
                tab === t.key ? "bg-foreground text-background" : "text-zinc-500 hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <Toolbar onProcess={runProcess} status={status} message={message} />

      <main className="flex-1 overflow-y-auto">
        {tab === "wips" && <WipsView refreshKey={refreshKey} />}
        {tab === "inbox" && <InboxView refreshKey={refreshKey} onChanged={() => setRefreshKey((k) => k + 1)} />}
        {tab === "logs" && <LogsView refreshKey={refreshKey} />}
      </main>
    </div>
  );
}
