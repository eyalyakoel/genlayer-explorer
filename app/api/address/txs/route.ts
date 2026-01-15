import { NextResponse } from "next/server";
import { publicClient } from "@/lib/genlayer";

function isAddress(a: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(a);
}

export async function GET(req: Request) {
  const t0 = Date.now();

  try {
    const url = new URL(req.url);

    const address = (url.searchParams.get("address") ?? "").trim();
    if (!isAddress(address)) {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }
    const addr = address.toLowerCase();

    const limit = Math.min(Number(url.searchParams.get("limit") ?? "25"), 50);

    // filter: any | in | out
    const filter = (url.searchParams.get("filter") ?? "any").toLowerCase();
    const wantIn = filter === "in";
    const wantOut = filter === "out";

    // how many blocks to scan (recent activity window)
    const scanBlocksRaw = Number(url.searchParams.get("scanBlocks") ?? "50");
    const scanBlocks = Math.max(1, Math.min(scanBlocksRaw, 2000)); // hard cap

    // cursorBlock = block to continue scanning from (inclusive)
    const cursorParam = url.searchParams.get("cursorBlock");
    const latest = await publicClient.getBlockNumber();
    let cursor = cursorParam ? BigInt(cursorParam) : latest;

    const items: {
      hash: `0x${string}`;
      blockNumber: string;
      timestamp: number;
      from: `0x${string}`;
      to: `0x${string}` | null;
      direction: "IN" | "OUT";
    }[] = [];

    const startCursor = cursor;
    const maxBlocksScan = BigInt(scanBlocks);

    while (cursor >= 0n && items.length < limit && startCursor - cursor < maxBlocksScan) {
      const b: any = await publicClient.getBlock({
        blockNumber: cursor,
        includeTransactions: true as any,
      });

      const bn = b.number?.toString() ?? "";
      const ts = Number(b.timestamp);
      const txs: any[] = Array.isArray(b.transactions) ? b.transactions : [];

      for (let i = txs.length - 1; i >= 0 && items.length < limit; i--) {
        const tx = txs[i];
        const hash = tx?.hash as `0x${string}` | undefined;
        const from = tx?.from as `0x${string}` | undefined;
        const to = (tx?.to ?? null) as `0x${string}` | null;

        if (!hash || !from) continue;

        const fromL = String(from).toLowerCase();
        const toL = to ? String(to).toLowerCase() : "";

        const isOut = fromL === addr;
        const isIn = toL === addr;

        if (!isOut && !isIn) continue;

        const direction: "IN" | "OUT" = isOut ? "OUT" : "IN";
        if (wantIn && direction !== "IN") continue;
        if (wantOut && direction !== "OUT") continue;

        items.push({ hash, blockNumber: bn, timestamp: ts, from, to, direction });
      }

      if (cursor === 0n) break;
      cursor -= 1n;
    }

    const scannedBlocks = Number(startCursor - cursor); // approx count scanned
    const fromBlock = cursor > 0n ? cursor.toString() : "0";
    const nextCursorBlock = cursor > 0n ? cursor.toString() : null;

    console.log("GET /api/address/txs", {
      address,
      filter,
      scanBlocks,
      scannedBlocks,
      ms: Date.now() - t0,
      found: items.length,
    });

    return NextResponse.json({ items, nextCursorBlock, scannedBlocks, fromBlock });
  } catch (err: any) {
    console.error("GET /api/address/txs failed:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
