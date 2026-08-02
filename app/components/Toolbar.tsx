"use client";

type Props = {
  onProcess: () => void;
  status: "idle" | "running" | "done" | "error";
  message: string;
};

export function Toolbar({ onProcess, status, message }: Props) {
  return (
    <div className="flex items-center gap-3 border-b border-black/10 px-4 py-3 dark:border-white/10">
      <button
        onClick={onProcess}
        disabled={status === "running"}
        className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background disabled:opacity-50"
      >
        {status === "running" ? "Processing…" : "Process Now"}
      </button>
      {message && <span className="text-sm text-zinc-500 dark:text-zinc-400">{message}</span>}
    </div>
  );
}
