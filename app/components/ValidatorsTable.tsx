"use client";

import { useEffect, useMemo, useState } from "react";
import CopyButton from "./CopyButton";

type ValidatorRow = {
  address: string;
  vStake?: string;
  stake?: string;
  live?: boolean;
  banned?: boolean;
  quarantined?: boolean;
  error?: string;
  identity?: {
    moniker?: string;
    name?: string;
    description?: string;
  };
};

function shortAddr(a?: string | null) {
  if (!a) return "—";
  return a.length <= 14 ? a : `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function parseStake(v: ValidatorRow): bigint {
  const raw = (v.vStake ?? v.stake ?? "0").toString();
  const token = raw.split(" ")[0] ?? "0";
  const intPart = token.includes(".") ? token.split(".")[0] : token;
  try {
    return BigInt(intPart || "0");
  } catch {
    return 0n;
  }
}

function Spinner() {
  return (
    <div
      className="h-5 w-5 rounded-full border-2 border-slate-500/40 border-t-slate-200 animate-spin"
      aria-label="Loading"
    />
  );
}

export default function ValidatorsTable() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [q, setQ] = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 25;

  async function fetchData() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/validators", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "Failed");
      setData(j);
    } catch (e: any) {
      setErr(e?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const epoch = data?.epoch ?? {};
  const activeCount = epoch?.activeValidatorsCount ?? "—";
  const minStake = epoch?.validatorMinStake ?? "—";

  const rows: ValidatorRow[] = useMemo(() => {
    const arr: any[] = Array.isArray(data?.validators) ? data.validators : [];

    const normalized: ValidatorRow[] = arr.map((v: any) => {
      if (typeof v === "string") return { address: v };
      return {
        ...v,
        address: v.address ?? v.validator ?? v.addr ?? "",
        identity: v.identity ?? v.validatorIdentity ?? undefined,
      } as ValidatorRow;
    });

    const qq = q.trim().toLowerCase();
    const filtered = qq
      ? normalized.filter((v) => {
          const addr = String(v.address ?? "").toLowerCase();
          const name = String(v.identity?.moniker ?? v.identity?.name ?? "").toLowerCase();
          return addr.includes(qq) || name.includes(qq);
        })
      : normalized;

    const sorted = [...filtered].sort((a, b) => {
      const sa = parseStake(a);
      const sb = parseStake(b);
      if (sa === sb) return String(a.address).localeCompare(String(b.address));
      return sortDir === "desc" ? (sb > sa ? 1 : -1) : (sa > sb ? 1 : -1);
    });

    return sorted;
  }, [data, q, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [q, sortDir]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden relative">
      <div className="px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="text-slate-300 text-sm flex items-center gap-2">
          <span>Validators</span>
          <span className="text-slate-500 text-xs">({rows.length}/{String(activeCount)})</span>
          {loading ? (
            <span className="inline-flex items-center gap-2 text-xs text-slate-500">
              <Spinner />
              Loading…
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or address…"
            className="h-9 w-64 rounded-xl border border-slate-800 bg-slate-950/40 px-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-slate-700"
          />

          <button
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            className="h-9 rounded-xl border border-slate-800 bg-slate-900/40 px-3 text-sm text-slate-300 hover:bg-slate-900/70"
            title="Toggle sort direction"
          >
            Stake {sortDir === "desc" ? "↓" : "↑"}
          </button>

          <button
            onClick={fetchData}
            className="h-9 rounded-xl border border-slate-800 bg-slate-900/40 px-3 text-sm text-slate-300 hover:bg-slate-900/70"
            title="Refresh"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="px-4 py-3 text-xs text-slate-500 flex flex-wrap gap-3 border-b border-slate-800">
        <span>
          Active: <span className="text-slate-200">{String(activeCount)}</span>
        </span>
        <span className="text-slate-600">•</span>
        <span>
          Min stake: <span className="text-slate-200">{String(minStake)}</span>
        </span>
      </div>

      {err ? (
        <div className="px-4 py-4 text-sm text-red-200 flex items-center justify-between gap-3">
          <span>{err}</span>
          <button
            onClick={fetchData}
            className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-xs hover:bg-slate-900/70"
          >
            Retry
          </button>
        </div>
      ) : null}

      {!err && (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-400 text-xs">
              <tr className="border-b border-slate-800">
                <th className="text-left font-medium px-4 py-3">Validator</th>
                <th className="text-left font-medium px-4 py-3">Stake</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {pageRows.map((v) => {
                const addr = String(v.address ?? "");
                const stake = v.vStake ?? v.stake ?? "—";
                const name = v.identity?.moniker ?? v.identity?.name ?? null;

                const statusText = v.error
                  ? "lookup failed"
                  : v.banned
                    ? "banned"
                    : v.quarantined
                      ? "quarantined"
                      : v.live === false
                        ? "offline"
                        : "live";

                return (
                  <tr key={addr}>
                    <td className="px-4 py-3">
                      <a
                        className="text-sky-300 hover:underline"
                        href={`/validators/${encodeURIComponent(addr)}`}
                        title={addr}
                      >
                        <div className="font-medium">{name ? name : shortAddr(addr)}</div>
                        <div className="mt-1 font-mono text-xs text-slate-500">{addr}</div>
                      </a>
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-200">
                      {String(stake)} <span className="text-slate-500">GEN</span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-xs rounded-md border border-slate-700 px-2 py-0.5 text-slate-200">
                        {statusText}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <CopyButton text={addr} />
                    </td>
                  </tr>
                );
              })}

              {/* Loading empty state (so it won't look "empty") */}
              {loading && pageRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10">
                    <div className="flex items-center justify-center gap-3 text-slate-300">
                      <Spinner />
                      <span className="text-sm">Loading validators…</span>
                    </div>
                  </td>
                </tr>
              ) : null}

              {!loading && pageRows.length === 0 && !err ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-slate-400 text-sm">
                    No validators found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      <div className="px-4 py-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          Page {safePage} / {totalPages} • Showing {pageRows.length} of {rows.length} • Sorted by stake{" "}
          ({sortDir === "desc" ? "high → low" : "low → high"})
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-xs hover:bg-slate-900/70 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>

          <button
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-xs hover:bg-slate-900/70 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
