import { NextResponse } from "next/server";
import { getLatest } from "@/lib/getLatest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getLatest();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("GET /api/blocks/latest failed:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
