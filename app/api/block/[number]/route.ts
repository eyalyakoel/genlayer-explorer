import { NextResponse } from "next/server";
import { publicClient } from "@/lib/genlayer";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ number: string }> }
) {
  try {
    const { number } = await ctx.params;

    // validate early
    if (!number || isNaN(Number(number))) {
      return NextResponse.json(
        { error: "Invalid block number" },
        { status: 400 }
      );
    }

    const n = BigInt(number);

    const block = await publicClient.getBlock({
      blockNumber: n,
      includeTransactions: false,
    });

    if (!block) {
      return NextResponse.json(
        { error: "Block not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      number: block.number?.toString(),
      hash: block.hash,
      parentHash: block.parentHash,
      timestamp: Number(block.timestamp),
      txs: block.transactions,
    });
  } catch (err: any) {
    console.error("GET /api/block/[number] failed:", err);

    return NextResponse.json(
      {
        error: err?.message ?? "Internal server error",
      },
      { status: 500 }
    );
  }
}
