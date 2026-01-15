import { NextResponse } from "next/server";
import { createAccount, createClient } from "genlayer-js";
import { testnetAsimov } from "genlayer-js/chains";
import { http } from "viem";

export const dynamic = "force-dynamic";

function isAddress(a: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(a);
}

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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function looksLikeHtmlError(msg: string) {
  const m = msg.toLowerCase();
  return m.includes("<!doctype") || m.includes("<html") || m.includes("not valid json");
}

async function withRetries<T>(fn: () => Promise<T>) {
  const tries = [0, 350, 900];
  let lastErr: any = null;

  for (let i = 0; i < tries.length; i++) {
    if (tries[i] > 0) await sleep(tries[i]);
    try {
      return await fn();
    } catch (e: any) {
      lastErr = e;
      const msg = String(e?.message ?? e);

      if (looksLikeHtmlError(msg)) continue;

      if (i === tries.length - 1) break;
    }
  }
  throw lastErr;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ addr: string }> }
) {
  try {
    const rpcUrl = process.env.GENLAYER_RPC_URL;
    if (!rpcUrl) {
      return NextResponse.json(
        { error: "GENLAYER_RPC_URL is not set in .env.local" },
        { status: 500 }
      );
    }

    const { addr: rawAddr } = await params;
    const addr = (rawAddr ?? "").trim();

    if (!isAddress(addr)) {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
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
      transport: http(rpcUrl, { timeout: 20_000, retryCount: 0 }),
    } as any);

    const info = await withRetries(() =>
      (client as any).getValidatorInfo(addr as `0x${string}`)
    );

    return NextResponse.json({ address: addr, ...jsonSafe(info) });
  } catch (e: any) {
    const msg = String(e?.message ?? e);


    if (looksLikeHtmlError(msg)) {
      return NextResponse.json(
        {
          error:
            "RPC returned HTML (likely rate-limited / gateway). Try again in a few seconds.",
          details: msg.slice(0, 300),
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: msg ?? "Failed to load validator info" },
      { status: 500 }
    );
  }
}
