import { createPublicClient, http } from "viem";
import { defineChain } from "viem";

const rpcUrl = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL!;
const chainId = Number(process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID!);

export const genlayerChain = defineChain({
  id: chainId,
  name: "GenLayer Testnet",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: {
    default: { http: [rpcUrl] },
    public: { http: [rpcUrl] },
  },
});

export const publicClient = createPublicClient({
  chain: genlayerChain,
  transport: http(rpcUrl, { batch: true }),
});
