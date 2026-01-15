import { headers } from "next/headers";
import CopyButton from "../../components/CopyButton";

type BlockResp = {
  number: string;
  hash: string;
  parentHash: string;
  timestamp: number;
  txs: `0x${string}`[];
};

export default async function BlockPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;

  // build absolute base URL (works in dev + prod)
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const base = `${proto}://${host}`;

  const res = await fetch(`${base}/api/block/${number}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to load block");
  }

  const block: BlockResp = await res.json();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <a href="/blocks" className="text-slate-300 hover:underline text-sm">
          ← Back to Blocks
        </a>

        <div>
          <h1 className="text-2xl font-semibold">Block #{block.number}</h1>
          <div className="flex items-center gap-2 text-sm text-slate-400 font-mono break-all">
            {block.hash}
            <CopyButton text={block.hash} />
          </div>
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="px-5 py-4 border-b border-slate-800 text-slate-200 text-base">
            Block details
          </div>

          <div className="divide-y divide-slate-800 text-sm">
            <Row label="Block number" value={block.number} />
            <Row
              label="Timestamp"
              value={new Date(block.timestamp * 1000).toLocaleString()}
            />
            <Row
              label="Parent block"
              value={
                <a
                  href={`/block/${parseInt(block.number) - 1}`}
                  className="text-sky-300 hover:underline font-mono"
                >
                  {block.parentHash.slice(0, 14)}…{block.parentHash.slice(-10)}
                </a>
              }
            />
            <Row label="Transactions" value={`${block.txs.length}`} />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="px-5 py-4 border-b border-slate-800 text-slate-200 text-base">
            Transactions
          </div>

          <div className="divide-y divide-slate-800">
            {block.txs.length === 0 ? (
              <div className="px-5 py-6 text-slate-400 text-sm">
                No transactions in this block
              </div>
            ) : (
              block.txs.map((tx) => (
                <div
                  key={tx}
                  className="px-5 py-4 flex items-center justify-between"
                >
                  <a
                    href={`/tx/${tx}`}
                    className="font-mono text-sky-300 hover:underline"
                  >
                    {tx.slice(0, 14)}…{tx.slice(-10)}
                  </a>
                  <CopyButton text={tx} />
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="px-5 py-3 flex justify-between gap-4">
      <div className="text-slate-400">{label}</div>
      <div className="text-slate-200 text-right">{value}</div>
    </div>
  );
}
