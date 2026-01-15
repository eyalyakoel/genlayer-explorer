import { NextResponse } from "next/server";
import { publicClient } from "@/lib/genlayer";

export const dynamic = "force-dynamic";

function isAddress(a: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(a);
}

const ERC20_ABI = [
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

// Known “native token / Ether” pseudo-token addresses (Blockscout-style fallback)
// You can add more known addresses here if needed.
const KNOWN_TOKENS: Record<
  string,
  { name: string; symbol: string; decimals: number }
> = {
  "0x000000000000000000000000000000000000800a": {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ addr: string }> }
) {
  try {
    const { addr: raw } = await params;
    const addr = (raw ?? "").trim().toLowerCase();

    if (!isAddress(addr)) {
      return NextResponse.json({ error: "Invalid token address" }, { status: 400 });
    }

    // Fallback for known tokens
    const known = KNOWN_TOKENS[addr];
    if (known) {
      return NextResponse.json({
        address: addr,
        name: known.name,
        symbol: known.symbol,
        decimals: known.decimals,
        source: "known",
      });
    }

    const token = addr as `0x${string}`;

    const [name, symbol, decimals] = await Promise.all([
      publicClient
        .readContract({ address: token, abi: ERC20_ABI, functionName: "name" })
        .catch(() => null),
      publicClient
        .readContract({ address: token, abi: ERC20_ABI, functionName: "symbol" })
        .catch(() => null),
      publicClient
        .readContract({ address: token, abi: ERC20_ABI, functionName: "decimals" })
        .catch(() => null),
    ]);

    return NextResponse.json({
      address: addr,
      name: typeof name === "string" ? name : null,
      symbol: typeof symbol === "string" ? symbol : null,
      decimals: typeof decimals === "number" ? decimals : null,
      source: "erc20",
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed to load token metadata" },
      { status: 500 }
    );
  }
}
