import { NextResponse } from "next/server";
import { publicClient } from "@/lib/genlayer";

type Body = { hashes: string[] };

function isValidTxHash(hash: string) {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const hashes = Array.isArray(body?.hashes) ? body.hashes : [];

    const clean = hashes
      .map((h) => String(h).trim())
      .filter((h) => isValidTxHash(h))
      .slice(0, 50); // safety

    const results = await Promise.all(
      clean.map(async (h) => {
        try {
          const tx = await publicClient.getTransaction({ hash: h as `0x${string}` });
          return {
            hash: h,
            from: tx.from,
            to: tx.to,
            value: tx.value?.toString?.() ?? "0",
          };
        } catch (e: any) {
          return {
            hash: h,
            error: e?.message ?? "Failed to fetch tx",
          };
        }
      })
    );

    return NextResponse.json({ items: results });
  } catch (err: any) {
    console.error("POST /api/tx/batch failed:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
