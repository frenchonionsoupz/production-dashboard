"use client";

import { useEffect, useMemo, useState } from "react";
import type { VaultFileSummary } from "@/lib/list-files";

export function LogsView({ refreshKey }: { refreshKey: number }) {
  const [logs, setLogs] = useState<VaultFileSummary[]>([]);
  const [tagFilter, setTagFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag for an on-mount data fetch
    setLoading(true);
    fetch("/api/logs")
      .then((r) => r.json())
      .then(setLogs)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const allTags = useMemo(
    () => Array.from(new Set(logs.flatMap((l) => l.tags))).sort(),
    [logs]
  );

  const filtered = logs.filter((l) => tagFilter === "all" || l.tags.includes(tagFilter));

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <label className="text-sm text-zinc-500">Tag:</label>
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/10"
        >
          <option value="all">All</option>
          {allTags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-zinc-500">Loading…</p>}
      {!loading && filtered.length === 0 && <p className="text-sm text-zinc-500">No logs yet.</p>}

      <div className="flex flex-col gap-3">
        {filtered.map((log) => (
          <div key={log.filename} className="rounded-lg border border-black/10 p-3 dark:border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{log.title}</h3>
              <span className="text-xs text-zinc-500">{log.date}</span>
            </div>
            {log.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {log.tags.map((t) => (
                  <span key={t} className="rounded-full bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10">
                    {t}
                  </span>
                ))}
              </div>
            )}
            {log.linked_to.length > 0 && (
              <p className="mt-1 text-xs text-zinc-500">Linked to: {log.linked_to.join(", ")}</p>
            )}
            <p className="mt-2 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">{log.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
