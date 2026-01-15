export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-2">
          <div className="h-7 w-72 rounded bg-slate-900/60 animate-pulse" />
          <div className="h-4 w-56 rounded bg-slate-900/40 animate-pulse" />
        </div>

        <div className="h-12 rounded-xl border border-slate-800 bg-slate-900/40 animate-pulse" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-2xl border border-slate-800 bg-slate-900/40 animate-pulse"
            />
          ))}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
          <div className="h-10 border-b border-slate-800 bg-slate-900/40 animate-pulse" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 border-b border-slate-800 bg-slate-900/20 animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  );
}
