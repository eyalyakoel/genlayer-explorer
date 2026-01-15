"use client";

import { useEffect, useState } from "react";

type BlockItem = {
  number: string;
  hash: string;
  timestamp: number;
  txCount: number;
};

export default function BlocksPage() {
  const [items, setItems] = useState<BlockItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore(cursor?: string | null) {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      qs.set("limit", "25");
      if (cursor) qs.set("cursor", cursor);

      const res = await fetch(`/api/blocks?${qs.toString()}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json?.error ?? "Failed to load blocks");

      setItems((prev) => [...prev, ...(json.items ?? [])]);
      setNextCursor(json.nextCursor ?? null);
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
            <a href="/" className="text-slate-300 hover:underline text-sm">← Back</a>
            <h1 className="text-2xl font-semibold mt-2">All Blocks</h1>
            <p className="text-slate-400 text-sm">Paginated block history</p>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 text-slate-300 text-sm">
            Blocks
          </div>

          <div className="divide-y divide-slate-800">
            {items.map((b) => (
              <div key={b.hash} className="px-4 py-3 flex items-center justify-between">
                <div className="space-y-1">
                  <a className="text-sky-300 hover:underline" href={`/block/${b.number}`}>
                    Block #{b.number}
                  </a>
                  <div className="text-xs text-slate-400 font-mono">
                    {b.hash.slice(0, 14)}…{b.hash.slice(-10)}
                  </div>
                </div>
                <div className="text-right text-sm text-slate-300">
                  <div>{b.txCount} tx</div>
                  <div className="text-xs text-slate-500">
                    {new Date(b.timestamp * 1000).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}

            {items.length === 0 && !loading ? (
              <div className="px-4 py-6 text-slate-400 text-sm">No blocks yet.</div>
            ) : null}
          </div>
        </section>

        <div className="flex justify-center">
          <button
            disabled={loading || !nextCursor}
            onClick={() => loadMore(nextCursor)}
            className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2 text-sm hover:bg-slate-900/70 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Loading…" : nextCursor ? "Load more" : "No more"}
          </button>
        </div>
      </div>
    </main>
  );
}
