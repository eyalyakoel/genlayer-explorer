"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function isTxHash(v: string) {
  return /^0x[a-fA-F0-9]{64}$/.test(v);
}

function isAddress(v: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(v);
}

function isBlockNumber(v: string) {
  return /^\d+$/.test(v);
}

export default function SearchBar({
  placeholder = "Search by tx hash / block number / address",
}: {
  placeholder?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const cleaned = useMemo(() => q.trim(), [q]);

  function go() {
    const v = cleaned;

    if (!v) return;

    // tx hash
    if (isTxHash(v)) {
      router.push(`/tx/${v}`);
      return;
    }

    // address
    if (isAddress(v)) {
      router.push(`/address/${v}`);
      return;
    }

    // block number
    if (isBlockNumber(v)) {
      router.push(`/block/${v}`);
      return;
    }

    // allow "0X" uppercase pasted
    const lower = v.toLowerCase();
    if (isTxHash(lower)) {
      router.push(`/tx/${lower}`);
      return;
    }
    if (isAddress(lower)) {
      router.push(`/address/${lower}`);
      return;
    }

    // fallback: do nothing (or you can show an error toast)
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") go();
          }}
          placeholder={placeholder}
          className="h-10 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-slate-700"
        />
      </div>

      <button
        onClick={go}
        className="h-10 rounded-xl border border-slate-800 bg-slate-900/40 px-4 text-sm text-slate-200 hover:bg-slate-900/70"
      >
        Go
      </button>
    </div>
  );
}
