import { NextResponse } from "next/server";
import { publicClient } from "@/lib/genlayer";

function toTxHash(t: any): `0x${string}` | null {
  if (typeof t === "string" && t.startsWith("0x")) return t as `0x${string}`;
  if (t && typeof t === "object" && typeof t.hash === "string" && t.hash.startsWith("0x")) {
    return t.hash as `0x${string}`;
  }
  return null;
}

export async function GET() {
  try {
    const latest = await publicClient.getBlockNumber();

    // Latest blocks list
    const blocksCount = 20n;
    const from = latest > blocksCount ? latest - blocksCount + 1n : 0n;

    const blocks = await Promise.all(
      Array.from({ length: Number(latest - from + 1n) }, (_, i) => {
        const n = from + BigInt(i);
        return publicClient.getBlock({ blockNumber: n });
      })
    );

    const newestFirst = [...blocks].reverse();

    //Stats
    const oldest = blocks[0];
    const newest = blocks[blocks.length - 1];

    const timeWindowSec = Number(newest.timestamp - oldest.timestamp) || 1;
    const txsTotal = blocks.reduce((acc, b) => acc + b.transactions.length, 0);
    const avgBlockTimeSec = blocks.length > 1 ? timeWindowSec / (blocks.length - 1) : 0;
    const tps = txsTotal / timeWindowSec;

    // Latest 20 transactions (scan backwards until we have 20
    const targetTxs = 20;
    const latestTxs: { hash: `0x${string}`; blockNumber: string; timestamp: number }[] = [];

    // Safety limit: don't scan forever if network is completely idle
    const maxBlocksToScan = 500n;

    let cursor = latest;
    while (cursor >= 0n && latestTxs.length < targetTxs && latest - cursor <= maxBlocksToScan) {
      // fetch in batches for speed
      const batchSize = 20n;
      const start = cursor >= batchSize - 1n ? cursor - (batchSize - 1n) : 0n;

      const batch = await Promise.all(
        Array.from({ length: Number(cursor - start + 1n) }, (_, i) => {
          const n = start + BigInt(i);
          return publicClient.getBlock({ blockNumber: n });
        })
      );

      // process newest -> oldest within the batch
      for (let i = batch.length - 1; i >= 0 && latestTxs.length < targetTxs; i--) {
        const b = batch[i];
        const bn = b.number?.toString() ?? "";
        const ts = Number(b.timestamp);

        for (const rawTx of b.transactions) {
          const h = toTxHash(rawTx);
          if (!h) continue;

          latestTxs.push({ hash: h, blockNumber: bn, timestamp: ts });
          if (latestTxs.length >= targetTxs) break;
        }
      }

      if (start === 0n) break;
      cursor = start - 1n;
    }

    return NextResponse.json({
      latest: latest.toString(),
      stats: {
        blocksCount: Number(blocks.length),
        timeWindowSec,
        txsTotal,
        avgBlockTimeSec,
        tps,
      },
      blocks: newestFirst.map((b) => ({
        number: b.number?.toString(),
        hash: b.hash,
        timestamp: Number(b.timestamp),
        txCount: b.transactions.length,
      })),
      latestTxs, // always present, up to 20
    });
  } catch (err: any) {
    console.error("GET /api/blocks/latest failed:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
