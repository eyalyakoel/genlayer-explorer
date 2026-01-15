"use client";

import { useEffect, useState } from "react";
import CopyButton from "./CopyButton";

function short(a?: string | null) {
  if (!a) return "—";
  return a.length <= 18 ? a : `${a.slice(0, 8)}…${a.slice(-6)}`;
}

function statusFrom(v: any) {
  if (!v) return "—";
  if (v.banned) return "banned";
  if (v.quarantined) return "quarantined";
  if (v.live === false) return "offline";
  return "live";
}

function fmtStake(stake: any) {
  if (!stake) return "—";
  const s = String(stake);
  const token = s.split(" ")[0];
  if (!token) return s;

  if (token.includes(".")) {
    const [a, b] = token.split(".");
    return `${Number(a).toLocaleString()}.${(b ?? "").slice(0, 2)} GEN`;
  }

  if (/^\d+$/.test(token)) {
    return `${Number(token).toLocaleString()} GEN`;
  }

  return s;
}

export default function ValidatorDetails({ addr }: { addr: string }) {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr(null);
      setData(null);

      try {
        const r = await fetch(`/api/validators/${addr}`, {
          cache: "no-store",
        });
        const j = await r.json().catch(() => null);

        if (!r.ok) {
          throw new Error(j?.error ?? `Request failed (${r.status})`);
        }

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
  }, [addr]);

  const address = data?.address ?? data?.validator ?? data?.addr ?? addr;
  const owner = data?.owner ?? null;
  const operator = data?.operator ?? null;
  const stake = data?.vStake ?? data?.stake ?? null;

  const identity = data?.identity ?? null;
  const moniker = identity?.moniker ?? identity?.name ?? null;
  const description = identity?.description ?? null;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 text-slate-300 text-sm flex items-center justify-between">
        <span>Validator Details</span>
        {loading ? <span className="text-xs text-slate-500">Loading…</span> : null}
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

      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xl font-semibold">
              {moniker ? moniker : short(String(address))}
            </div>

            <div className="mt-1 font-mono text-xs text-slate-400 break-all">
              {String(address)}
            </div>

            {description ? (
              <div className="mt-3 text-sm text-slate-300 max-w-3xl leading-relaxed">
                {description}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`/address/${address}`}
              className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-900/70"
            >
              Address page →
            </a>
            <CopyButton text={String(address)} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
            <div className="text-xs text-slate-500">Status</div>
            <div className="mt-2">
              <span className="text-xs rounded-md border border-slate-700 px-2 py-0.5 text-slate-200">
                {statusFrom(data)}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
            <div className="text-xs text-slate-500">Stake</div>
            <div className="mt-2 font-mono text-base text-slate-100">
              {fmtStake(stake)}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
            <div className="text-xs text-slate-500">Owner</div>
            <div className="mt-2 font-mono text-xs text-slate-200 break-all">
              {owner ?? "—"}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
            <div className="text-xs text-slate-500">Operator</div>
            <div className="mt-2 font-mono text-xs text-slate-200 break-all">
              {operator ?? "—"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
