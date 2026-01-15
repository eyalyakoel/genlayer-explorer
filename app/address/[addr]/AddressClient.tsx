"use client";

import { useEffect, useMemo, useState } from "react";
import CopyButton from "../../components/CopyButton";

type Item = {
  hash: `0x${string}`;
  blockNumber: string;
  timestamp: number;
  from: `0x${string}`;
  to: `0x${string}` | null;
  direction: "IN" | "OUT";
};

function isAddress(a: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(a);
}

function shortHex(x?: string | null) {
  if (!x) return "—";
  return x.length <= 14 ? x : `${x.slice(0, 10)}…${x.slice(-6)}`;
}

function timeAgo(tsSec: number) {
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - tsSec);
  if (diff < 60) return `${diff}s ago`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function AddressClient({ addr }: { addr: string }) {
  const safeAddr = useMemo(() => (addr ?? "").trim(), [addr]);

  const [items, setItems] = useState<Item[]>([]);
  const [nextCursorBlock, setNextCursorBlock] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<"any" | "in" | "out">("any");

  // recent activity window (user-controlled)
  const [scanBlocks, setScanBlocks] = useState<number>(5);
  const [scannedBlocks, setScannedBlocks] = useState<number>(0);

  // Balance
  const [balanceGen, setBalanceGen] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  async function loadMore(cursor?: string | null, reset = false) {
    // guard: invalid address
    if (!isAddress(safeAddr)) {
      setItems([]);
      setNextCursorBlock(null);
      setScannedBlocks(0);
      setError("Invalid address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const qs = new URLSearchParams();
      qs.set("address", safeAddr);
      qs.set("limit", "25");
      qs.set("filter", filter);
      qs.set("scanBlocks", String(scanBlocks));
      if (cursor) qs.set("cursorBlock", cursor);

      // timeout so the UI never hangs forever
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12_000);

      const res = await fetch(`/api/address/txs?${qs.toString()}`, {
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to load");

      const newItems: Item[] = json.items ?? [];

      if (reset) setItems(newItems);
      else setItems((prev) => [...prev, ...newItems]);

      setNextCursorBlock(json.nextCursorBlock ?? null);
      setScannedBlocks(Number(json.scannedBlocks ?? 0));
    } catch (e: any) {

      if (e?.name === "AbortError") {
        return;
      }
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  // load balance
  useEffect(() => {
    let alive = true;

    async function loadBalance() {
      setBalanceGen(null);

      if (!isAddress(safeAddr)) return;

      setBalanceLoading(true);
      try {
        const r = await fetch(`/api/address/${safeAddr}/balance`, { cache: "no-store" });
        const j = await r.json().catch(() => null);
        if (!r.ok) throw new Error(j?.error ?? "Failed to load balance");
        if (!alive) return;
        setBalanceGen(String(j?.balanceGen ?? "—"));
      } catch {
        if (!alive) return;
        setBalanceGen(null);
      } finally {
        if (alive) setBalanceLoading(false);
      }
    }

    loadBalance();
    return () => {
      alive = false;
    };
  }, [safeAddr]);

  // initial + when addr changes
  useEffect(() => {
    setItems([]);
    setNextCursorBlock(null);
    setScannedBlocks(0);

    if (!isAddress(safeAddr)) {
      setError("Invalid address");
      return;
    }

    loadMore(null, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeAddr]);

  // reload when filter/scanBlocks changes
  useEffect(() => {
    if (!isAddress(safeAddr)) return;

    setItems([]);
    setNextCursorBlock(null);
    setScannedBlocks(0);

    loadMore(null, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, scanBlocks]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <a href="/" className="text-slate-300 hover:underline text-sm">
          ← Back
        </a>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Address</h1>

          <div className="flex flex-wrap items-center gap-2">
            <div className="font-mono text-sm text-slate-300 break-all">{safeAddr}</div>
            <CopyButton text={safeAddr} />
          </div>

          {/* Balance row */}
          <div className="text-sm text-slate-300">
            Balance:{" "}
            <span className="font-mono text-slate-100">
              {balanceLoading ? "Loading…" : balanceGen != null ? `${balanceGen} GEN` : "—"}
            </span>
          </div>

          <div className="text-xs text-slate-500">
            Showing <span className="text-slate-300">recent activity</span> by scanning the last{" "}
            <span className="text-slate-300">{scanBlocks}</span> blocks (testnet RPC limitation).
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-300">
            Latest {Math.min(25, items.length)} transactions{" "}
            {loading ? <span className="text-slate-500">• scanning…</span> : null}
            {!loading && scannedBlocks > 0 ? (
              <span className="text-slate-500">
                • scanned ~{Math.min(scannedBlocks, scanBlocks)} blocks
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Scan window controls */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Scan</span>
              {[5, 10, 20].map((n) => (
                <button
                  key={n}
                  onClick={() => setScanBlocks(n)}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${
                    scanBlocks === n
                      ? "border-slate-700 bg-slate-900/70 text-slate-100"
                      : "border-slate-800 bg-slate-900/40 text-slate-300 hover:bg-slate-900/70"
                  }`}
                >
                  {n}
                </button>
              ))}
              <span className="text-xs text-slate-500">blocks</span>
            </div>

            {/* Direction filter */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter("any")}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  filter === "any"
                    ? "border-slate-700 bg-slate-900/70 text-slate-100"
                    : "border-slate-800 bg-slate-900/40 text-slate-300 hover:bg-slate-900/70"
                }`}
              >
                Any
              </button>
              <button
                onClick={() => setFilter("in")}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  filter === "in"
                    ? "border-slate-700 bg-slate-900/70 text-slate-100"
                    : "border-slate-800 bg-slate-900/40 text-slate-300 hover:bg-slate-900/70"
                }`}
              >
                In
              </button>
              <button
                onClick={() => setFilter("out")}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  filter === "out"
                    ? "border-slate-700 bg-slate-900/70 text-slate-100"
                    : "border-slate-800 bg-slate-900/40 text-slate-300 hover:bg-slate-900/70"
                }`}
              >
                Out
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-red-200 flex items-center justify-between gap-3">
            <span>{error}</span>
            <button
              onClick={() => loadMore(null, true)}
              className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-xs hover:bg-slate-900/70 shrink-0"
            >
              Retry
            </button>
          </div>
        ) : null}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 text-slate-300 text-sm">
            Transactions
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400 text-xs">
                <tr className="border-b border-slate-800">
                  <th className="text-left font-medium px-4 py-3">Tx Hash</th>
                  <th className="text-left font-medium px-4 py-3">Block</th>
                  <th className="text-left font-medium px-4 py-3">Age</th>
                  <th className="text-left font-medium px-4 py-3">From</th>
                  <th className="text-left font-medium px-4 py-3">To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {items.map((t) => (
                  <tr key={t.hash}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <a className="font-mono text-sky-300 hover:underline" href={`/tx/${t.hash}`}>
                          {shortHex(t.hash)}
                        </a>
                        <CopyButton text={t.hash} />
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <a className="text-sky-300 hover:underline font-mono" href={`/block/${t.blockNumber}`}>
                        {t.blockNumber}
                      </a>
                    </td>

                    <td className="px-4 py-3 text-slate-300">
                      <span className="mr-2 text-xs rounded-md border border-slate-700 px-2 py-0.5">
                        {t.direction}
                      </span>
                      {timeAgo(t.timestamp)}
                    </td>

                    <td className="px-4 py-3">
                      <a className="font-mono text-sky-300 hover:underline" href={`/address/${t.from}`}>
                        {shortHex(t.from)}
                      </a>
                    </td>

                    <td className="px-4 py-3">
                      {t.to ? (
                        <a className="font-mono text-sky-300 hover:underline" href={`/address/${t.to}`}>
                          {shortHex(t.to)}
                        </a>
                      ) : (
                        <span className="font-mono text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}

                {items.length === 0 && !loading && !error ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-400 text-sm" colSpan={5}>
                      No recent activity found (scanned last {scanBlocks} blocks).
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex justify-center">
          <button
            disabled={loading || !nextCursorBlock}
            onClick={() => loadMore(nextCursorBlock, false)}
            className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2 text-sm hover:bg-slate-900/70 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Loading…" : nextCursorBlock ? "Load more" : "No more"}
          </button>
        </div>
      </div>
    </main>
  );
}
