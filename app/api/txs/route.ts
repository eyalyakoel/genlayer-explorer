import { NextResponse } from "next/server";
import { publicClient } from "@/lib/genlayer";

function toTxHash(t: any): `0x${string}` | null {
  if (typeof t === "string" && t.startsWith("0x")) return t as `0x${string}`;
  if (t && typeof t === "object" && typeof t.hash === "string" && t.hash.startsWith("0x")) {
    return t.hash as `0x${string}`;
  }
  return null;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const limitTxs = Math.min(Number(url.searchParams.get("limit") ?? "25"), 50);

    // cursorBlock = block number to continue scanning from (inclusive). If missing, start from latest.
    const cursorParam = url.searchParams.get("cursorBlock");
    const latest = await publicClient.getBlockNumber();
    let cursor = cursorParam ? BigInt(cursorParam) : latest;

    const items: { hash: `0x${string}`; blockNumber: string; timestamp: number }[] = [];

    // scan blocks backwards until we collect enough txs or hit 0
    while (cursor >= 0n && items.length < limitTxs) {
      const b = await publicClient.getBlock({ blockNumber: cursor });

      const bn = b.number?.toString() ?? "";
      const ts = Number(b.timestamp);

      for (const rawTx of b.transactions) {
        const h = toTxHash(rawTx);
        if (!h) continue;

        items.push({ hash: h, blockNumber: bn, timestamp: ts });
        if (items.length >= limitTxs) break;
      }

      if (cursor === 0n) break;
      cursor -= 1n;
    }

    // nextCursorBlock = continue from the block *before* the last scanned one
    const nextCursorBlock = cursor > 0n ? cursor.toString() : null;

    return NextResponse.json({
      items,
      nextCursorBlock,
    });
  } catch (err: any) {
    console.error("GET /api/txs failed:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
