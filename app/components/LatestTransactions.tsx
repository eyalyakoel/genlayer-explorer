"use client";

import { useEffect, useMemo, useState } from "react";
import CopyButton from "./CopyButton";

type LatestTx = {
  hash: `0x${string}`;
  blockNumber: string;
  timestamp: number;
};

type TxMeta = {
  hash: string;
  from?: string;
  to?: string | null;
  value?: string;
  error?: string;
};

function shortAddr(a?: string | null) {
  if (!a) return "—";
  if (a.length <= 14) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function shortHash(h: string) {
  return `${h.slice(0, 14)}…${h.slice(-10)}`;
}

export default function LatestTransactions({
  txs,
  limit = 5,
}: {
  txs: LatestTx[];
  limit?: number;
}) {
  const [meta, setMeta] = useState<Record<string, TxMeta>>({});
  const [loading, setLoading] = useState(false);

  const shown = useMemo(() => txs.slice(0, limit), [txs, limit]);
  const hashes = useMemo(() => shown.map((t) => t.hash), [shown]);

  useEffect(() => {
    let alive = true;

    async function run() {
      if (hashes.length === 0) {
        setMeta({});
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/tx/batch", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ hashes }),
        });

        const json = await res.json();
        const items: TxMeta[] = json.items ?? [];

        if (!alive) return;

        const map: Record<string, TxMeta> = {};
        for (const it of items) map[it.hash] = it;
        setMeta(map);
      } catch {
        if (!alive) return;
        setMeta({});
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [hashes]);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden flex flex-col h-full">
      {/* Header — same sizing as Blocks */}
      <div className="px-5 py-4 border-b border-slate-800 text-slate-200 text-base flex items-center justify-between">
        <span>Latest Transactions</span>
        <span className="text-xs text-slate-500">{loading ? "Loading…" : ""}</span>
      </div>

      {/* Body */}
      <div className="divide-y divide-slate-800 flex-1">
        {shown.map((t) => {
          const m = meta[t.hash];
          const from = m?.error ? null : (m?.from ?? "").trim() || null;
          const to = m?.error ? null : (m?.to ?? "").trim() || null;

          return (
            <div
              key={t.hash}
              className="px-5 py-4 flex items-center justify-between gap-3 min-h-23"
            >
              <div className="min-w-0 space-y-1">
                {/* First line — bigger like Blocks */}
                <a
                  className="font-mono text-sky-300 hover:underline text-base break-all"
                  href={`/tx/${t.hash}`}
                >
                  {shortHash(t.hash)}
                </a>

                {/* Second line — same style as Blocks subtext */}
                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                  <span className="text-slate-500">From</span>
                  {from ? (
                    <a
                      className="font-mono text-sky-300 hover:underline"
                      href={`/address/${from}`}
                      title={from}
                    >
                      {shortAddr(from)}
                    </a>
                  ) : (
                    <span className="font-mono text-slate-300">—</span>
                  )}

                  <span className="text-slate-500">To</span>
                  {to ? (
                    <a
                      className="font-mono text-sky-300 hover:underline"
                      href={`/address/${to}`}
                      title={to}
                    >
                      {shortAddr(to)}
                    </a>
                  ) : (
                    <span className="font-mono text-slate-300">—</span>
                  )}

                  <span className="text-slate-600">•</span>
                  <span className="text-slate-500">
                    Block{" "}
                    <a
                      className="text-sky-300 hover:underline font-mono"
                      href={`/block/${t.blockNumber}`}
                    >
                      {t.blockNumber}
                    </a>
                  </span>

                  {m?.error ? (
                    <>
                      <span className="text-slate-600">•</span>
                      <span className="text-red-300">lookup failed</span>
                    </>
                  ) : null}
                </div>
              </div>

              {/* Copy button — same position like your current */}
              <CopyButton text={t.hash} className="shrink-0" />
            </div>
          );
        })}

        {shown.length === 0 && (
          <div className="px-5 py-6 text-slate-400 text-sm">No transactions found.</div>
        )}
      </div>

      {/* Footer — same sizing as Blocks */}
      <div className="px-5 py-4 border-t border-slate-800 text-center mt-auto">
        <a
          href="/txs"
          className="text-slate-300 hover:text-slate-100 text-sm tracking-wide"
        >
          VIEW ALL TRANSACTIONS →
        </a>
      </div>
    </section>
  );
}
