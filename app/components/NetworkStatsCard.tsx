"use client";

import { useEffect, useState } from "react";

function fmt(n: number, digits = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

export default function NetworkStatsCard() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const r = await fetch("/api/network/stats", { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error ?? "Failed");
        if (!alive) return;
        setData(j);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "Failed");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const gasGwei =
    data?.gasPriceGwei != null && Number.isFinite(Number(data.gasPriceGwei))
      ? Number(data.gasPriceGwei)
      : null;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 text-slate-300 text-sm flex items-center justify-between">
        <span>Network Stats (RPC)</span>
        <span className="text-xs text-slate-500">{loading ? "Loading…" : ""}</span>
      </div>

      {err ? <div className="px-4 py-4 text-sm text-red-200">{err}</div> : null}

      {data ? (
        <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3">
            <div className="text-xs text-slate-500">Latest block</div>
            <div className="font-mono text-slate-100 mt-1">{data.latestBlock}</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3">
            <div className="text-xs text-slate-500">Avg block time</div>
            <div className="text-slate-100 mt-1">
              {fmt(Number(data.avgBlockTimeSec), 2)}s
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3">
            <div className="text-xs text-slate-500">Txs in latest block</div>
            <div className="text-slate-100 mt-1">{String(data.latestBlockTxs ?? "—")}</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3">
            <div className="text-xs text-slate-500">TPS estimate</div>
            <div className="text-slate-100 mt-1">{fmt(Number(data.tpsEstimate), 3)}</div>
            <div className="text-xs text-slate-500 mt-1">
              sampled ~{data.sample?.timeWindowSec ?? "—"}s
            </div>
          </div>

          {/* Gas tracker */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3">
            <div className="text-xs text-slate-500">Gas tracker</div>
            <div className="text-slate-100 mt-1">
              {gasGwei == null ? "—" : `${fmt(gasGwei, 1)} Gwei`}
            </div>
          </div>
        </div>
      ) : (
        !loading && !err && <div className="px-4 py-4 text-sm text-slate-400">No data.</div>
      )}
    </section>
  );
}
