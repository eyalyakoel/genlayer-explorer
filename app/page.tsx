import SearchBar from "./components/SearchBar";
import AutoRefreshToggle from "./components/AutoRefreshToggle";
import LatestTransactions from "./components/LatestTransactions";
import NetworkStatsMerged from "./components/NetworkStatsMerged";
import { getLatest, type LatestResp } from "@/lib/getLatest";
import { headers } from "next/headers";

function NavItem({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/30 px-3 py-2.5 text-sm text-slate-200 hover:bg-slate-900/60"
    >
      <span className="text-slate-300">{icon}</span>
      <span>{label}</span>
    </a>
  );
}

const Icons = {
  Blocks: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2l8 4v12l-8 4-8-4V6l8-4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Tx: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 7h10M7 12h10M7 17h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  ),
  Validators: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

export default async function Home() {
const data: LatestResp = await getLatest();

  const stats = data.stats ?? {
    blocksCount: 0,
    timeWindowSec: 0,
    txsTotal: 0,
    avgBlockTimeSec: 0,
    tps: 0,
  };

  const latestTxs = data.latestTxs ?? [];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* Auto refresh – top right */}
      <div className="fixed top-4 right-4 z-50">
        <AutoRefreshToggle intervalMs={10000} />
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 items-stretch">
          {/* Sidebar (navigation only) */}
          <aside className="lg:sticky lg:top-16 h-fit space-y-3 mt-100">
            <div className="text-xs text-slate-500">Quick navigation</div>

            <NavItem href="/validators" label="Validators" icon={Icons.Validators} />
            <NavItem href="/blocks" label="Blocks" icon={Icons.Blocks} />
            <NavItem href="/txs" label="Transactions" icon={Icons.Tx} />
          </aside>

          {/* Main content */}
          <section className="space-y-7">
            <header className="space-y-4">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  GenLayer Testnet Explorer
                </h1>
                <p className="text-slate-400 text-base">Latest blocks & transactions</p>
              </div>

              <div className="max-w-4xl">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-3 ">
                  <SearchBar />
                </div>
              </div>
            </header>

            <NetworkStatsMerged height={data.latest} overview={stats} />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-7 items-stretch">
              {/* Latest Blocks */}
              <section className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden flex flex-col">
                <div className="px-5 py-4 border-b border-slate-800 text-slate-200 text-base">
                  Latest Blocks
                </div>

                <div className="divide-y divide-slate-800">
                  {data.blocks.slice(0, 5).map((b) => (
                    <div
                      key={b.hash}
                      className="px-5 py-4 flex items-center justify-between min-h-23"
                    >
                      <div className="space-y-1">
                        <a
                          className="text-sky-300 hover:underline text-base"
                          href={`/block/${b.number}`}
                        >
                          Block #{b.number}
                        </a>
                        <div className="text-xs text-slate-400 font-mono">
                          {b.hash.slice(0, 14)}…{b.hash.slice(-10)}
                        </div>
                      </div>

                      <div className="text-right text-sm text-slate-300">
                        <div className="text-base">{b.txCount} tx</div>
                        <div className="text-xs text-slate-500">
                          {new Date(b.timestamp * 1000).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-5 py-4 border-t border-slate-800 text-center mt-auto">
                  <a
                    href="/blocks"
                    className="text-slate-300 hover:text-slate-100 text-sm tracking-wide"
                  >
                    VIEW ALL BLOCKS →
                  </a>
                </div>
              </section>

              {/* Latest Transactions */}
              <LatestTransactions txs={latestTxs} limit={5} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
