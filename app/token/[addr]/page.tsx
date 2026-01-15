import { headers } from "next/headers";
import CopyButton from "../../components/CopyButton";

type TokenMeta = {
  address: string;
  name: string | null;
  symbol: string | null;
  decimals: number | null;
};

export default async function TokenPage({
  params,
}: {
  params: Promise<{ addr: string }>;
}) {
  const { addr } = await params;

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const base = `${proto}://${host}`;

  // build absolute URL safely
  const url = new URL(`/api/token/${addr}`, base);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.error ?? `Failed to load token (${res.status})`);
  }

  const meta: TokenMeta = await res.json();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <a href="/" className="text-slate-300 hover:underline text-sm">
          ← Back
        </a>

        <h1 className="text-2xl font-semibold">
          {meta.name
            ? `${meta.name}${meta.symbol ? ` (${meta.symbol})` : ""}`
            : "Token"}
        </h1>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Address:</span>
            <span className="font-mono break-all">{meta.address}</span>
            <CopyButton text={meta.address} />
          </div>

          <div>
            <span className="text-slate-400">Name:</span>{" "}
            <span className="text-slate-100">{meta.name ?? "—"}</span>
          </div>

          <div>
            <span className="text-slate-400">Symbol:</span>{" "}
            <span className="text-slate-100">{meta.symbol ?? "—"}</span>
          </div>

          <div>
            <span className="text-slate-400">Decimals:</span>{" "}
            <span className="text-slate-100">{meta.decimals ?? "—"}</span>
          </div>
        </section>
      </div>
    </main>
  );
}
