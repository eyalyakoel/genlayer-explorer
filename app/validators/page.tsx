import ValidatorsTable from "../components/ValidatorsTable";

export default function ValidatorsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <a href="/" className="text-slate-300 hover:underline text-sm">
          ← Back
        </a>

        <div>
          <h1 className="text-2xl font-semibold">Validators</h1>
          <p className="text-slate-400 text-sm">
            Active validator set (testnet)
          </p>
        </div>

        <ValidatorsTable />
      </div>
    </main>
  );
}
