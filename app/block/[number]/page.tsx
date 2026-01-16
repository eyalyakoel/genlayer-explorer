import CopyButton from "../../components/CopyButton";
import { publicClient } from "@/lib/genlayer";

type BlockResp = {
  number: string;
  hash: string;
  parentHash: string;
  timestamp: number;
  txs: `0x${string}`[];
};

function toTxHash(t: any): `0x${string}` | null {
  if (typeof t === "string" && t.startsWith("0x")) return t as `0x${string}`;
  if (t && typeof t === "object" && typeof t.hash === "string" && t.hash.startsWith("0x")) {
    return t.hash as `0x${string}`;
  }
  return null;
}

export default async function BlockPage({
  params,
}: {
  params: { number: string } | Promise<{ number: string }>;
}) {
  const p = await Promise.resolve(params);
  const raw = p?.number;

  // Strict validate: only digits
  if (typeof raw !== "string" || !/^\d+$/.test(raw)) {
    throw new Error("Invalid block number");
  }

  const n = BigInt(raw);

  const b = await publicClient.getBlock({ blockNumber: n });

  const block: BlockResp = {
    number: b.number?.toString() ?? raw,
    hash: b.hash,
    parentHash: b.parentHash,
    timestamp: Number(b.timestamp),
    txs: (b.transactions ?? []).map(toTxHash).filter(Boolean) as `0x${string}`[],
  };

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
                  href={`/block/${n > 0n ? (n - 1n).toString() : "0"}`}
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
