import { NextResponse } from "next/server";
import { publicClient } from "@/lib/genlayer";

export const dynamic = "force-dynamic";

function isAddress(a: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(a);
}

function formatUnits18(wei: bigint, decimals = 18, maxFrac = 6) {
  const base = 10n ** BigInt(decimals);
  const int = wei / base;
  const frac = (wei % base).toString().padStart(decimals, "0").slice(0, maxFrac);
  return `${int.toString()}.${frac}`.replace(/\.?0+$/, "");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ addr: string }> }
) {
  try {
    const { addr: raw } = await params;
    const addr = (raw ?? "").trim();

    if (!isAddress(addr)) {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }

    const bal = await publicClient.getBalance({ address: addr as `0x${string}` });

    return NextResponse.json({
      address: addr,
      balanceWei: bal.toString(),
      balanceGen: formatUnits18(bal, 18, 6),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed to load balance" },
      { status: 500 }
    );
  }
}
