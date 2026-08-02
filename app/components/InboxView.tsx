"use client";

import { useEffect, useState } from "react";
import type { VaultFileSummary } from "@/lib/list-files";

export function InboxView({
  refreshKey,
  onChanged,
}: {
  refreshKey: number;
  onChanged: () => void;
}) {
  const [items, setItems] = useState<VaultFileSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCorrection, setOpenCorrection] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag for an on-mount data fetch
    setLoading(true);
    fetch("/api/inbox")
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  async function approve(filename: string) {
    setBusy(filename);
    const res = await fetch(`/api/inbox/${encodeURIComponent(filename)}/approve`, { method: "POST" });
    setBusy(null);
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.filename !== filename));
      onChanged();
    } else {
      const { error } = await res.json();
      alert(`Couldn't approve: ${error}`);
    }
  }

  async function submitCorrection(filename: string) {
    if (!comment.trim()) return;
    setBusy(filename);
    const res = await fetch(`/api/inbox/${encodeURIComponent(filename)}/correct`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment }),
    });
    setBusy(null);
    if (res.ok) {
      setOpenCorrection(null);
      setComment("");
    } else {
      const { error } = await res.json();
      alert(`Couldn't save correction: ${error}`);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {loading && <p className="text-sm text-zinc-500">Loading…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-zinc-500">Nothing waiting for review.</p>
      )}

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.filename} className="rounded-lg border border-black/10 p-3 dark:border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{item.title}</h3>
              <span className="text-xs text-zinc-500">{item.date}</span>
            </div>
            {item.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {item.tags.map((t) => (
                  <span key={t} className="rounded-full bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10">
                    {t}
                  </span>
                ))}
              </div>
            )}
            {item.linked_to.length > 0 && (
              <p className="mt-1 text-xs text-zinc-500">Linked to: {item.linked_to.join(", ")}</p>
            )}
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">{item.content}</p>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => approve(item.filename)}
                disabled={busy === item.filename}
                className="rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => setOpenCorrection(openCorrection === item.filename ? null : item.filename)}
                className="rounded-full border border-black/10 px-3 py-1 text-xs dark:border-white/10"
              >
                Leave correction
              </button>
            </div>

            {openCorrection === item.filename && (
              <div className="mt-2 flex flex-col gap-2">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What should the agent have done differently?"
                  className="rounded border border-black/10 bg-transparent p-2 text-sm dark:border-white/10"
                  rows={2}
                />
                <button
                  onClick={() => submitCorrection(item.filename)}
                  disabled={busy === item.filename}
                  className="self-start rounded-full border border-black/10 px-3 py-1 text-xs dark:border-white/10"
                >
                  Save correction
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
