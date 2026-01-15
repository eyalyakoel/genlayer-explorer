"use client";

import { useEffect, useMemo, useState } from "react";
import CopyButton from "./CopyButton";

function short(a?: string | null) {
  if (!a) return "—";
  return a.length <= 14 ? a : `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export default function ValidatorsCard({ limit = 10 }: { limit?: number }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setErr(null);
      try {
        const r = await fetch("/api/validators", { cache: "no-store" });
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
    }

    run();
    return () => {
      alive = false;
    };
  }, []);

  const rows = useMemo(() => {
    const arr = Array.isArray(data?.validators) ? data.validators : [];
    return arr.slice(0, limit);
  }, [data, limit]);

  const activeCount = data?.epoch?.activeValidatorsCount ?? "—";
  const minStake = data?.epoch?.validatorMinStake ?? "—";

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 text-slate-300 text-sm flex items-center justify-between">
        <span>Validators</span>
        <span className="text-xs text-slate-500">{loading ? "Loading…" : ""}</span>
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
            onClick={() => location.reload()}
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
              {rows.map((v: any) => {
                const addr = v?.address ?? v;
                const stake = v?.vStake ?? v?.stake ?? "—";
                const live = v?.live;
                const banned = v?.banned;
                const quarantined = v?.quarantined;
                const hasError = Boolean(v?.error);

                const statusText = hasError
                  ? "lookup failed"
                  : banned
                    ? "banned"
                    : quarantined
                      ? "quarantined"
                      : live === false
                        ? "offline"
                        : "live";

                return (
                  <tr key={String(addr)}>
                    <td className="px-4 py-3">
                      <a className="font-mono text-sky-300 hover:underline" href={`/address/${addr}`}>
                        {short(String(addr))}
                      </a>
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-200">{String(stake)}</td>

                    <td className="px-4 py-3">
                      <span className="text-xs rounded-md border border-slate-700 px-2 py-0.5 text-slate-200">
                        {statusText}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CopyButton text={String(addr)} />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loading && rows.length === 0 && !err ? (
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

      <div className="px-4 py-3 border-t border-slate-800 text-center">
        <span className="text-xs text-slate-500">
          Showing top {Math.min(limit, rows.length)} (MVP)
        </span>
      </div>
    </section>
  );
}
