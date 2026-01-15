import { NextResponse } from "next/server";
import { publicClient } from "@/lib/genlayer";

export const dynamic = "force-dynamic";

function isValidTxHash(hash: string) {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

function jsonSafe(value: any): any {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (value && typeof value === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) out[k] = jsonSafe(v);
    return out;
  }
  return value;
}

function weiToGweiStr(wei: bigint, digits = 6) {
  const gweiInt = wei / 1_000_000_000n;
  const rem = wei % 1_000_000_000n;
  const frac = rem.toString().padStart(9, "0").slice(0, digits);
  return `${gweiInt.toString()}.${frac}`;
}

function formatUnits18(wei: bigint, decimals = 18, maxFrac = 12) {
  const base = 10n ** BigInt(decimals);
  const int = wei / base;
  const frac = (wei % base).toString().padStart(decimals, "0").slice(0, maxFrac);
  // strip trailing zeros
  return `${int.toString()}.${frac}`.replace(/\.?0+$/, "");
}

const ERC20_TRANSFER_TOPIC0 =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

function topicToAddress(topic: string) {
  if (!topic || !topic.startsWith("0x") || topic.length !== 66) return null;
  return ("0x" + topic.slice(-40)).toLowerCase();
}

function hexToBigIntSafe(hex: string) {
  try {
    return BigInt(hex);
  } catch {
    return null;
  }
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await ctx.params;

    if (!hash || !isValidTxHash(hash)) {
      return NextResponse.json({ error: "Invalid transaction hash" }, { status: 400 });
    }

    const h = hash as `0x${string}`;

    const [tx, receipt, latestBlockNum] = await Promise.all([
      publicClient.getTransaction({ hash: h }),
      publicClient.getTransactionReceipt({ hash: h }),
      publicClient.getBlockNumber(),
    ]);

    if (!tx) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const blockNumber = receipt.blockNumber ?? null;

    // timestamp + confirmations
    let timestamp: number | null = null;
    let confirmations: number | null = null;

    if (blockNumber != null) {
      try {
        const block = await publicClient.getBlock({ blockNumber });
        timestamp = Number(block.timestamp);
      } catch {
        timestamp = null;
      }

      try {
        confirmations =
          latestBlockNum >= blockNumber ? Number(latestBlockNum - blockNumber) : 0;
      } catch {
        confirmations = null;
      }
    }

    const gasUsed: bigint = receipt.gasUsed ?? 0n;
    const gasLimit: bigint | null = (tx as any).gas ?? null;

    const gasPriceWei: bigint | null = (tx as any).gasPrice ?? null;
    const effectiveGasPriceWei: bigint | null =
      (receipt as any).effectiveGasPrice ?? gasPriceWei ?? null;

    const feeWei: bigint | null =
      effectiveGasPriceWei != null ? gasUsed * effectiveGasPriceWei : null;

    const logsArr = Array.isArray(receipt.logs) ? receipt.logs : [];

    // token transfers (ERC20 Transfer only, parsed from logs)
    const tokenTransfers = logsArr
      .filter((l: any) => Array.isArray(l.topics) && l.topics.length >= 3)
      .filter(
        (l: any) => String(l.topics[0]).toLowerCase() === ERC20_TRANSFER_TOPIC0
      )
      .map((l: any) => {
        const from = topicToAddress(l.topics[1]);
        const to = topicToAddress(l.topics[2]);
        const amount = hexToBigIntSafe(l.data);
        return {
          token: String(l.address),
          from,
          to,
          amountWei: amount ?? 0n,
        };
      });

    // input bytes
    const input: string = (tx as any).input ?? "0x";
    const inputBytes =
      typeof input === "string" && input.startsWith("0x")
        ? Math.max(0, (input.length - 2) / 2)
        : null;

    return NextResponse.json(
      jsonSafe({
        hash: tx.hash,
        from: tx.from,
        to: tx.to ?? null,

        valueWei: tx.value ?? 0n,
        nonce: Number(tx.nonce),
        type: (tx as any).type ?? null,

        blockNumber,
        timestamp,
        confirmations,

        gasUsed,
        gasLimit,

        gasPriceWei,
        effectiveGasPriceWei,
        gasPriceGwei:
          effectiveGasPriceWei != null ? weiToGweiStr(effectiveGasPriceWei, 6) : null,


        gasPriceGen:
          effectiveGasPriceWei != null ? formatUnits18(effectiveGasPriceWei, 18, 18) : null,
        feeWei,
        feeGen: feeWei != null ? formatUnits18(feeWei, 18, 12) : null,

        inputBytes,

        status: receipt.status,

        logsCount: logsArr.length,
        logs: logsArr.map((l: any) => ({
          logIndex: l.logIndex,
          address: l.address,
          topics: l.topics,
          data: l.data,
        })),

        tokenTransfers: tokenTransfers.map((t: any) => ({
          token: t.token,
          from: t.from,
          to: t.to,
          amountWei: t.amountWei,
        })),
      })
    );
  } catch (err: any) {
    console.error("GET /api/tx/[hash] failed:", err);

    const msg = String(err?.message ?? "");
    const isNotFound =
      msg.toLowerCase().includes("not found") ||
      msg.toLowerCase().includes("could not") ||
      msg.toLowerCase().includes("unknown transaction");

    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: isNotFound ? 404 : 500 }
    );
  }
}
