"use client";

import { useEffect, useState } from "react";

type OverviewStats = {
  blocksCount: number;
  timeWindowSec: number;
  txsTotal: number;
  avgBlockTimeSec: number;
  tps: number;
};

type LiveStats = {
  avgBlockTimeSec: number;
  latestBlockTxs: number;
  tpsEstimate: number;
  gasPriceGwei?: number | null;
  txpool?: { pending?: string; queued?: string } | null;
  sample?: { timeWindowSec?: number };
};

function fmt(n: number, digits = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

function hexToDecString(hex: any) {
  if (!hex) return null;
  try {
    return BigInt(hex).toString();
  } catch {
    return null;
  }
}

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/35 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl border border-slate-800 bg-slate-900/40 p-2 text-slate-300">
          {icon}
        </div>

        <div className="min-w-0">
          <div className="text-xs text-slate-500">{label}</div>
          <div className="mt-1 font-mono text-[22px] leading-7 text-slate-100">
            {value}
          </div>
          {sub ? <div className="mt-1 text-[11px] text-slate-600">{sub}</div> : null}
        </div>
      </div>
    </div>
  );
}

const Icons = {
  Height: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 20V10M10 20V4M16 20v-8M22 20V8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  Clock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 8v5l3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  ),
  Txs: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 7h10M7 12h10M7 17h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  ),
  TPS: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 16l4-4 4 3 6-7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 7v6h-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Block: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2l8 4v12l-8 4-8-4V6l8-4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 2v20"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeOpacity="0.7"
      />
    </svg>
  ),
  Gas: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 4h8v6H7V4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M7 10v10h8V10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M15 7h2l2 2v8a3 3 0 0 1-3 3h-1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
};

export default function NetworkStatsMerged({
  height,
  overview,
}: {
  height: string;
  overview: OverviewStats;
}) {
  const [tab, setTab] = useState<"overview" | "live">("overview");
  const [live, setLive] = useState<LiveStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (tab !== "live") return;
      if (live) return;

      setLoading(true);
      setErr(null);
      try {
        const r = await fetch("/api/network/stats", { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error ?? "Failed to load live stats");
        if (!alive) return;
        setLive(j);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "Failed to load live stats");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [tab, live]);

  const gasGwei =
    live?.gasPriceGwei != null && Number.isFinite(Number(live.gasPriceGwei))
      ? Number(live.gasPriceGwei)
      : null;

  const pending = hexToDecString(live?.txpool?.pending);
  const queued = hexToDecString(live?.txpool?.queued);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/30 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3">
        <div>
          <div className="text-slate-200 text-sm">Network Stats</div>
          <div className="text-xs text-slate-500">Real-time metrics from RPC</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("overview")}
            className={`rounded-xl border px-3 py-1.5 text-xs ${
              tab === "overview"
                ? "border-slate-700 bg-slate-900/70 text-slate-100"
                : "border-slate-800 bg-slate-900/40 text-slate-300 hover:bg-slate-900/70"
            }`}
          >
            Overview (last {overview.blocksCount})
          </button>
          <button
            onClick={() => setTab("live")}
            className={`rounded-xl border px-3 py-1.5 text-xs ${
              tab === "live"
                ? "border-slate-700 bg-slate-900/70 text-slate-100"
                : "border-slate-800 bg-slate-900/40 text-slate-300 hover:bg-slate-900/70"
            }`}
          >
            Live (RPC)
          </button>
        </div>
      </div>

      {tab === "overview" ? (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="latest block" value={height} icon={Icons.Height} />

          <StatCard
            label="Average block time"
            value={`${fmt(overview.avgBlockTimeSec, 2)}s`}
            icon={Icons.Clock}
          />

          <StatCard
            label={`Transactions (last ${overview.blocksCount} blocks)`}
            value={String(overview.txsTotal)}
            icon={Icons.Txs}
          />

          <StatCard
            label="TPS estimate"
            value={fmt(overview.tps, 3)}
            sub={`window: ${overview.timeWindowSec}s`}
            icon={Icons.TPS}
          />
        </div>
      ) : (
        <div className="p-4">
          {err ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950/35 p-3 text-sm text-red-200">
              {err}
            </div>
          ) : null}

          {!err && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <StatCard
                label="Average block time (live)"
                value={loading && !live ? "…" : `${fmt(Number(live?.avgBlockTimeSec ?? NaN), 2)}s`}
                icon={Icons.Clock}
              />

              <StatCard
                label="Txs in latest block"
                value={loading && !live ? "…" : String(live?.latestBlockTxs ?? "—")}
                icon={Icons.Block}
              />

              <StatCard
                label="TPS estimate (live)"
                value={loading && !live ? "…" : fmt(Number(live?.tpsEstimate ?? NaN), 3)}
                sub={`sampled ~${String(live?.sample?.timeWindowSec ?? "—")}s`}
                icon={Icons.TPS}
              />

              <StatCard
                label="Gas tracker"
                value={loading && !live ? "…" : gasGwei == null ? "—" : `${fmt(gasGwei, 3)} Gwei`}
                icon={Icons.Gas}
              />

            </div>
          )}
        </div>
      )}
    </section>
  );
}
