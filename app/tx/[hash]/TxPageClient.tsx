"use client";

import { useEffect, useState } from "react";
import CopyButton from "../../components/CopyButton";

type TxResp = {
  hash: string;
  from: string;
  to: string | null;

  blockNumber: string | null;
  timestamp: number | null;
  confirmations: number | null;

  nonce: number;
  type: string | null;

  valueWei: string;

  gasUsed: string;
  gasLimit: string | null;

  gasPriceGwei: string | null;
  gasPriceGen: string | null;

  feeWei: string | null;
  feeGen: string | null;

  inputBytes: number | null;

  status: string;

  tokenTransfers: {
    token: string;
    from: string | null;
    to: string | null;
    amountWei: string; // raw integer string
  }[];
};

type TokenMeta = {
  name: string | null;
  symbol: string | null;
  decimals: number | null;
};

function secondsAgo(ts: number) {
  const now = Date.now() / 1000;
  const d = Math.max(0, Math.floor(now - ts));
  if (d < 60) return `${d}s ago`;
  const m = Math.floor(d / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

function fmtDate(ts: number) {
  return new Date(ts * 1000).toLocaleString();
}

function shortAddr(a?: string | null) {
  if (!a) return "—";
  return a.length <= 14 ? a : `${a.slice(0, 6)}…${a.slice(-4)}`;
}

// Format token amount from raw integer string + decimals
function formatUnits(amountWei: string, decimals: number, maxFrac = 6) {
  let bi: bigint;
  try {
    bi = BigInt(amountWei);
  } catch {
    return null;
  }

  if (decimals <= 0) return bi.toString();

  const base = 10n ** BigInt(decimals);
  const intPart = bi / base;
  const fracFull = (bi % base).toString().padStart(decimals, "0");
  const fracTrimmed = fracFull.slice(0, maxFrac).replace(/0+$/, "");

  if (!fracTrimmed) return intPart.toString();
  return `${intPart.toString()}.${fracTrimmed}`;
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border px-3 py-1.5 text-xs ${
        active
          ? "border-slate-700 bg-slate-900/70 text-slate-100"
          : "border-slate-800 bg-slate-900/40 text-slate-300 hover:bg-slate-900/70"
      }`}
    >
      {children}
    </button>
  );
}

export default function TxPageClient({ hash }: { hash: string }) {
  const [tx, setTx] = useState<TxResp | null>(null);
  const [tab, setTab] = useState<"details" | "transfers">("details");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // token metadata cache (by token address)
  const [tokenMeta, setTokenMeta] = useState<Record<string, TokenMeta>>({});

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const r = await fetch(`/api/tx/${hash}`, { cache: "no-store" });
        const j = await r.json().catch(() => null);
        if (!r.ok) throw new Error(j?.error ?? `Failed (${r.status})`);
        if (!alive) return;
        setTx(j);
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
  }, [hash]);

  // fetch token metadata for tokens in transfers (if missing)
  useEffect(() => {
    if (!tx) return;

    const tokens = Array.from(new Set((tx.tokenTransfers ?? []).map((x) => x.token)));
    const missing = tokens.filter((t) => tokenMeta[t] === undefined);

    if (missing.length === 0) return;

    let alive = true;

    (async () => {
      const entries = await Promise.all(
        missing.map(async (t) => {
          const r = await fetch(`/api/token/${t}`, { cache: "no-store" });
          const j = await r.json().catch(() => null);
          if (!r.ok) {
            return [t, { name: null, symbol: null, decimals: null }] as const;
          }
          return [
            t,
            {
              name: j?.name ?? null,
              symbol: j?.symbol ?? null,
              decimals: typeof j?.decimals === "number" ? j.decimals : null,
            },
          ] as const;
        })
      );

      if (!alive) return;

      setTokenMeta((prev) => {
        const next = { ...prev };
        for (const [k, v] of entries) next[k] = v;
        return next;
      });
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tx]);

  const transfers = tx?.tokenTransfers ?? [];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <a href="/" className="text-slate-300 hover:underline text-sm">
          ← Back
        </a>

        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Transaction</h1>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-slate-400 font-mono text-sm break-all">{hash}</div>
            <CopyButton text={hash} />
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-2">
          <TabButton active={tab === "details"} onClick={() => setTab("details")}>
            Details
          </TabButton>
          <TabButton active={tab === "transfers"} onClick={() => setTab("transfers")}>
            Token transfers ({transfers.length})
          </TabButton>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-300">
            Loading…
          </div>
        ) : null}

        {err ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-red-200">
            {err}
          </div>
        ) : null}

        {/* DETAILS */}
        {!loading && !err && tx && tab === "details" ? (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-sm space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 w-48">From</span>
              <a className="font-mono text-sky-300 hover:underline break-all" href={`/address/${tx.from}`}>
                {tx.from}
              </a>
              <CopyButton text={tx.from} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 w-48">To</span>
              {tx.to ? (
                <>
                  <a className="font-mono text-sky-300 hover:underline break-all" href={`/address/${tx.to}`}>
                    {tx.to}
                  </a>
                  <CopyButton text={tx.to} />
                </>
              ) : (
                <span className="font-mono">—</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 w-48">Status</span>
              <span className="font-mono">{tx.status}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 w-48">Block</span>
              {tx.blockNumber ? (
                <a className="text-sky-300 hover:underline font-mono" href={`/block/${tx.blockNumber}`}>
                  {tx.blockNumber}
                </a>
              ) : (
                <span className="font-mono">—</span>
              )}

              {tx.confirmations != null ? (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-300">{tx.confirmations} confirmations</span>
                </>
              ) : null}
            </div>

            {tx.timestamp != null ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-400 w-48">Timestamp</span>
                <span className="text-slate-300">{secondsAgo(tx.timestamp)}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300">{fmtDate(tx.timestamp)}</span>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 w-48">Nonce / Type</span>
              <span className="font-mono">{tx.nonce}</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono">{tx.type ?? "—"}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 w-48">Gas usage & limit</span>
              <span className="font-mono">{tx.gasUsed}</span>
              {tx.gasLimit ? (
                <>
                  <span className="text-slate-600">/</span>
                  <span className="font-mono">{tx.gasLimit}</span>
                </>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 w-48">Gas price</span>
              <span className="font-mono">
                {tx.gasPriceGen ? `${tx.gasPriceGen} GEN` : "—"}{" "}
                {tx.gasPriceGwei ? <span className="text-slate-500">({tx.gasPriceGwei} Gwei)</span> : null}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 w-48">Transaction fee</span>
              <span className="font-mono">
                {tx.feeGen ? `${tx.feeGen} GEN` : "—"}{" "}
                {tx.feeWei ? <span className="text-slate-500">({tx.feeWei} wei)</span> : null}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 w-48">Input</span>
              <span className="font-mono">{tx.inputBytes ?? "—"} bytes</span>
            </div>
          </section>
        ) : null}

        {/* TOKEN TRANSFERS */}
        {!loading && !err && tx && tab === "transfers" ? (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 text-slate-300 text-sm">
              Token transfers
            </div>

            {transfers.length === 0 ? (
              <div className="px-4 py-6 text-slate-400 text-sm">No token transfers.</div>
            ) : (
              <div className="divide-y divide-slate-800">
                {transfers.map((t, i) => {
                  const meta = tokenMeta[t.token];
                  const tokenLabel =
                    meta?.name
                      ? `${meta.name}${meta.symbol ? ` (${meta.symbol})` : ""}`
                      : shortAddr(t.token);

                  const decimals = typeof meta?.decimals === "number" ? meta.decimals : null;
                  const prettyAmount =
                    decimals != null ? formatUnits(t.amountWei, decimals, 6) : null;

                  const symbol = meta?.symbol ?? null;

                  return (
                    <div key={i} className="px-4 py-4 text-sm space-y-2">
                      <div className="text-xs text-slate-500">Token</div>
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          className="font-mono text-sky-300 hover:underline break-all"
                          href={`/token/${t.token}`}
                          title={t.token}
                        >
                          {tokenLabel}
                        </a>
                        <CopyButton text={t.token} />
                        {symbol ? <span className="text-xs text-slate-500">• {symbol}</span> : null}
                      </div>

                      <div className="text-xs text-slate-500">From → To</div>
                      <div className="flex flex-wrap items-center gap-2 font-mono">
                        <a
                          className="text-sky-300 hover:underline"
                          href={t.from ? `/address/${t.from}` : "#"}
                          title={t.from ?? ""}
                        >
                          {shortAddr(t.from)}
                        </a>
                        <span className="text-slate-500">→</span>
                        <a
                          className="text-sky-300 hover:underline"
                          href={t.to ? `/address/${t.to}` : "#"}
                          title={t.to ?? ""}
                        >
                          {shortAddr(t.to)}
                        </a>
                      </div>

                      <div className="text-xs text-slate-500">Amount</div>
                      <div className="font-mono">
                        {prettyAmount != null
                          ? `${prettyAmount}${symbol ? ` ${symbol}` : ""}`
                          : `${t.amountWei} (raw)`}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}
