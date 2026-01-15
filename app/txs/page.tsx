"use client";

import { useEffect, useState } from "react";
import CopyButton from "../components/CopyButton";

type TxItem = {
  hash: `0x${string}`;
  blockNumber: string;
  timestamp: number;
};

function shortHash(h: string) {
  return `${h.slice(0, 14)}…${h.slice(-10)}`;
}

export default function TxsPage() {
  const [items, setItems] = useState<TxItem[]>([]);
  const [nextCursorBlock, setNextCursorBlock] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore(cursor?: string | null) {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      qs.set("limit", "25");
      if (cursor) qs.set("cursorBlock", cursor);

      const res = await fetch(`/api/txs?${qs.toString()}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json?.error ?? "Failed to load transactions");

      setItems((prev) => [...prev, ...(json.items ?? [])]);
      setNextCursorBlock(json.nextCursorBlock ?? null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMore(null);
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <a href="/" className="text-slate-300 hover:underline text-sm">
              ← Back
            </a>
            <h1 className="text-2xl font-semibold mt-2">All Transactions</h1>
            <p className="text-slate-400 text-sm">
              Paginated transaction history (scanned from blocks)
            </p>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 text-slate-200 text-base">
            Transactions
          </div>

          <div className="divide-y divide-slate-800">
            {items.map((t) => (
              <div
                key={t.hash}
                className="px-5 py-4 flex items-center justify-between gap-3 min-h-23"
              >
                <div className="min-w-0 space-y-1">
                  {/* big + blue like blocks */}
                  <a
                    className="font-mono text-sky-300 hover:underline text-base break-all"
                    href={`/tx/${t.hash}`}
                  >
                    {shortHash(t.hash)}
                  </a>

                  {/* ✅ subline like blocks */}
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                    <span className="text-slate-500">
                      Block{" "}
                      <a
                        className="text-sky-300 hover:underline font-mono"
                        href={`/block/${t.blockNumber}`}
                      >
                        {t.blockNumber}
                      </a>
                    </span>

                    <span className="text-slate-600">•</span>

                    <span>{new Date(t.timestamp * 1000).toLocaleString()}</span>
                  </div>
                </div>

                <CopyButton text={t.hash} className="shrink-0" />
              </div>
            ))}

            {items.length === 0 && !loading ? (
              <div className="px-5 py-6 text-slate-400 text-sm">No transactions yet.</div>
            ) : null}
          </div>
        </section>

        <div className="flex justify-center">
          <button
            disabled={loading || !nextCursorBlock}
            onClick={() => loadMore(nextCursorBlock)}
            className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2 text-sm hover:bg-slate-900/70 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Loading…" : nextCursorBlock ? "Load more" : "No more"}
          </button>
        </div>
      </div>
    </main>
  );
}
