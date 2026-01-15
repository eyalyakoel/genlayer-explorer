"use client";

import ValidatorDetails from "../../components/ValidatorDetails";

export default function ValidatorPageClient({ addr }: { addr: string }) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <a href="/validators" className="text-slate-300 hover:underline text-sm">
          ← Back to Validators
        </a>

        <div>
          <h1 className="text-2xl font-semibold">Validator</h1>
          <div className="text-slate-400 text-sm font-mono break-all">{addr}</div>
        </div>

        <ValidatorDetails addr={addr} />
      </div>
    </main>
  );
}
