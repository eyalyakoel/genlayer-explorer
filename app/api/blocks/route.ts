import { NextResponse } from "next/server";
import { publicClient } from "@/lib/genlayer";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "25"), 50);

    // cursor = block number to start from (inclusive). If missing, start from latest.
    const cursorParam = url.searchParams.get("cursor");
    const latest = await publicClient.getBlockNumber();
    const cursor = cursorParam ? BigInt(cursorParam) : latest;

    const start = cursor;
    const end = start >= BigInt(limit - 1) ? start - BigInt(limit - 1) : 0n;

    const blocks = await Promise.all(
      Array.from({ length: Number(start - end + 1n) }, (_, i) => {
        const n = start - BigInt(i);
        return publicClient.getBlock({ blockNumber: n });
      })
    );

    const items = blocks.map((b) => ({
      number: b.number?.toString(),
      hash: b.hash,
      timestamp: Number(b.timestamp),
      txCount: b.transactions.length,
    }));

    const nextCursor = end > 0n ? (end - 1n).toString() : null;

    return NextResponse.json({
      items,
      nextCursor,
    });
  } catch (err: any) {
    console.error("GET /api/blocks failed:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
