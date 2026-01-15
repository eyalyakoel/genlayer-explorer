import { NextResponse } from "next/server";
import { createAccount, createClient } from "genlayer-js";
import { testnetAsimov } from "genlayer-js/chains";
import { http } from "viem";

export const dynamic = "force-dynamic";

function jsonSafe<T>(value: T): any {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (value && typeof value === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value as any)) out[k] = jsonSafe(v);
    return out;
  }
  return value;
}

function isAddress(a: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(a);
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, idx: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;

  async function worker() {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      results[idx] = await fn(items[idx], idx);
    }
  }

  const workers = Array.from({ length: Math.max(1, limit) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function GET() {
  try {
    const rpcUrl = process.env.GENLAYER_RPC_URL;
    if (!rpcUrl) {
      return NextResponse.json(
        { error: "GENLAYER_RPC_URL is not set in .env.local" },
        { status: 500 }
      );
    }

    const account = createAccount();

    const chain = {
      ...testnetAsimov,
      rpcUrls: {
        ...testnetAsimov.rpcUrls,
        default: { http: [rpcUrl] },
        public: { http: [rpcUrl] },
      },
    } as typeof testnetAsimov;

    const client = createClient({
      chain,
      account,
      transport: http(rpcUrl, { timeout: 15_000, retryCount: 0 }),
    } as any);

    const anyClient = client as any;

    // 1) get list
    let list: any = [];
    if (typeof anyClient.getValidators === "function") {
      list = await anyClient.getValidators();
    } else if (typeof anyClient.getActiveValidators === "function") {
      list = await anyClient.getActiveValidators();
    } else if (typeof anyClient.getValidatorSet === "function") {
      list = await anyClient.getValidatorSet();
    } else {
      throw new Error("No validators list method in SDK");
    }

    // normalize to addresses
    const addrs: string[] = (Array.isArray(list) ? list : [])
      .map((v: any) => {
        if (typeof v === "string") return v;
        return v?.address ?? v?.validator ?? v?.addr ?? "";
      })
      .map((s: any) => String(s))
      .filter((a) => isAddress(a));

    // enrich each validator
    const concurrency = 6;
    const enriched = await mapLimit(addrs, concurrency, async (addr) => {
      try {
        const info = await anyClient.getValidatorInfo(addr as `0x${string}`);

        return { address: addr, ...jsonSafe(info) };
      } catch (e: any) {

        return { address: addr, error: e?.message ?? "lookup failed" };
      }
    });


    return NextResponse.json(
      jsonSafe({
        epoch: {
          activeValidatorsCount: addrs.length,
          validatorMinStake: "—",
        },
        validators: enriched,
      })
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed to load validators" },
      { status: 500 }
    );
  }
}
