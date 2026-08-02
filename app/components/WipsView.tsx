"use client";

import { useEffect, useState } from "react";
import type { VaultFileSummary } from "@/lib/list-files";

const STATUS_ORDER = ["idea", "outline", "drafting", "review", "final"];

export function WipsView({ refreshKey }: { refreshKey: number }) {
  const [wips, setWips] = useState<VaultFileSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag for an on-mount data fetch
    setLoading(true);
    fetch("/api/wips")
      .then((r) => r.json())
      .then(setWips)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filtered = wips
    .filter((w) => statusFilter === "all" || w.status === statusFilter)
    .sort((a, b) => STATUS_ORDER.indexOf(a.status ?? "") - STATUS_ORDER.indexOf(b.status ?? ""));

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <label className="text-sm text-zinc-500">Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/10"
        >
          <option value="all">All</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-zinc-500">Loading…</p>}
      {!loading && filtered.length === 0 && (
        <p className="text-sm text-zinc-500">No WIPs{statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}.</p>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((w) => (
          <div key={w.filename} className="rounded-lg border border-black/10 p-3 dark:border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{w.title}</h3>
              <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10">{w.status}</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">{w.date}</p>
            {w.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {w.tags.map((t) => (
                  <span key={t} className="rounded-full bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10">
                    {t}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-2 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">{w.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
