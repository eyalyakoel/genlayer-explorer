"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AutoRefreshToggle({ intervalMs = 10000 }: { intervalMs?: number }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const id = setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => clearInterval(id);
  }, [enabled, intervalMs, router]);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setEnabled((v) => !v)}
        className={`rounded-xl border px-3 py-2 text-sm ${
          enabled
            ? "border-slate-700 bg-slate-900/70 text-slate-100"
            : "border-slate-800 bg-slate-900/40 text-slate-300 hover:bg-slate-900/70"
        }`}
      >
        Auto-refresh: {enabled ? "ON" : "OFF"}
      </button>

      <div className="text-xs text-slate-500">
        {enabled ? `Every ${Math.round(intervalMs / 1000)}s` : "Manual"}
      </div>
    </div>
  );
}
