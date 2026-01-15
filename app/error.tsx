"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // You can also log to a monitoring service here
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>

        <p className="text-slate-300">
          The explorer hit an error while loading data. You can retry, or go back to the home page.
        </p>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="text-xs text-slate-500 mb-2">Error details</div>
          <div className="font-mono text-xs text-slate-200 break-all">
            {error.message}
          </div>
          {error.digest ? (
            <div className="mt-2 text-[11px] text-slate-500">digest: {error.digest}</div>
          ) : null}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => reset()}
            className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2 text-sm hover:bg-slate-900/70"
          >
            Retry
          </button>

          <a
            href="/"
            className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2 text-sm hover:bg-slate-900/70"
          >
            Go Home
          </a>
        </div>
      </div>
    </main>
  );
}
