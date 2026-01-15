import { NextResponse } from "next/server";
import { publicClient } from "@/lib/genlayer";

export const dynamic = "force-dynamic";

function weiToGwei(wei: bigint): number {
  const gweiInt = wei / 1_000_000_000n;
  const gweiRem = wei % 1_000_000_000n;
  return Number(gweiInt) + Number(gweiRem) / 1e9;
}

export async function GET() {
  try {
    const latest = await publicClient.getBlockNumber();


    const [b0, b1, b2]: any[] = await Promise.all([
      publicClient.getBlock({ blockNumber: latest, includeTransactions: true as any }),
      publicClient.getBlock({
        blockNumber: latest > 0n ? latest - 1n : 0n,
        includeTransactions: true as any,
      }),
      publicClient.getBlock({
        blockNumber: latest > 1n ? latest - 2n : 0n,
        includeTransactions: true as any,
      }),
    ]);

    const t0 = Number(b0.timestamp);
    const t1 = Number(b1.timestamp);
    const t2 = Number(b2.timestamp);

    const dt01 = Math.max(1, t0 - t1);
    const dt12 = Math.max(1, t1 - t2);
    const avgBlockTimeSec = (dt01 + dt12) / 2;

    const txs0 = Array.isArray(b0.transactions) ? b0.transactions.length : 0;
    const txs1 = Array.isArray(b1.transactions) ? b1.transactions.length : 0;
    const txs2 = Array.isArray(b2.transactions) ? b2.transactions.length : 0;

    const totalTxs = txs0 + txs1 + txs2;
    const totalTime = Math.max(1, t0 - t2);
    const tpsEstimate = totalTxs / totalTime;

    // Gas tracker (RPC real-time)
    let gasPriceWei: bigint | null = null;
    let gasPriceGwei: number | null = null;

    try {
      gasPriceWei = await publicClient.getGasPrice();
      gasPriceGwei = weiToGwei(gasPriceWei);
    } catch {
      gasPriceWei = null;
      gasPriceGwei = null;
    }

    return NextResponse.json({
      latestBlock: latest.toString(),
      latestBlockTimestamp: t0,
      avgBlockTimeSec,
      latestBlockTxs: txs0,
      tpsEstimate,

      gasPriceWei: gasPriceWei ? gasPriceWei.toString() : null,
      gasPriceGwei,

      sample: {
        blocks: [
          String(latest),
          String(latest > 0n ? latest - 1n : 0n),
          String(latest > 1n ? latest - 2n : 0n),
        ],
        txs: [txs0, txs1, txs2],
        timeWindowSec: totalTime,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed to load network stats" },
      { status: 500 }
    );
  }
}
